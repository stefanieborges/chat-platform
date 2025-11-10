using System;
using System.Net.Http.Headers;
using System.Text;
using System.Text.Json;
using API.Common;
using API.DTOs;
using API.Extensions;
using API.Models;
using API.Services;
using Microsoft.AspNetCore.Identity;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;

namespace API.Endpoints;

public static class AccountEndpoint
{
    public static RouteGroupBuilder MapAccountEndpoints(this WebApplication app)
    {
        var group = app.MapGroup("/api/account").WithTags("account");

        group.MapPost("/register", async (HttpContext context, UserManager<AppUser> userManager, [FromForm] string fullName, [FromForm] string email, [FromForm] string password, [FromForm] string username, [FromForm] IFormFile? profileImage) =>
        {

            var userFromDb = await userManager.FindByEmailAsync(email);
            if (userFromDb != null)
            {
                return Results.BadRequest(Response<string>.Failure("User already exists"));
            }

            if (profileImage is null)
            {
                return Results.BadRequest(Response<string>.Failure("Profile image is required"));
            }

            var picture = await Services.FileUpload.UploadFileAsync(profileImage);

            picture = $"{context.Request.Scheme}://{context.Request.Host}/uploads/{picture}";

            var user = new AppUser
            {
                Email = email,
                FullName = fullName,
                UserName = username,
                ProfileImage = picture
            };

            var result = await userManager.CreateAsync(user, password);

            if (!result.Succeeded)
            {
                return Results.BadRequest(Response<string>.Failure(result.Errors.Select(x => x.Description).FirstOrDefault()!));
            }

            return Results.Ok(Response<string>.Success("", "User registered successfully"));
        }).DisableAntiforgery();

        group.MapPost("login", async (UserManager<AppUser> userManager, TokenService tokenService, LoginDTO dto) =>
        {
            if (dto is null)
            {
                return Results.BadRequest(Response<string>.Failure("Invalid client request  "));
            }

            var user = await userManager.FindByEmailAsync(dto.Email);

            if (user == null)
            {
                return Results.BadRequest(Response<string>.Failure("Usuário não encontrado!"));
            }

            var result = await userManager.CheckPasswordAsync(user, dto.Password);

            if (!result)
            {
                return Results.BadRequest(Response<string>.Failure("Senha inválida!"));
            }

            var token = tokenService.GenerateToken(user.Id, user.UserName!);

            return Results.Ok(Response<string>.Success(token, "Login feito com sucesso!"));
        });

        group.MapGet("/me", async (UserManager<AppUser> userManager, HttpContext context) =>
        {
            var currentLoggedInUserNameId = context.User.GetUserId();
            var currentLoggerInUser = await userManager.Users.SingleOrDefaultAsync(x => x.Id == currentLoggedInUserNameId.ToString())!;
            return Results.Ok(Response<AppUser>.Success(currentLoggerInUser!, "User fetched successfully"));
        }).RequireAuthorization();


        // Endpoint OpenAI Chat - agora dentro do grupo
        group.MapPost("/chatOpenai", async (
            ChatRequest request,
            IHttpClientFactory httpClientFactory,
            IConfiguration configuration) =>
        {
            var apiKey = configuration["OpenAI:ApiKey"];

            if (string.IsNullOrEmpty(apiKey))
                return Results.BadRequest(new { error = "API Key não configurada" });

            var client = httpClientFactory.CreateClient();
            client.DefaultRequestHeaders.Authorization = new AuthenticationHeaderValue("Bearer", apiKey);

            var payload = new
            {
                model = "gpt-5",
                input = request.Message
            };

            var content = new StringContent(
                JsonSerializer.Serialize(payload),
                Encoding.UTF8,
                new MediaTypeHeaderValue("application/json")
            );

            try
            {
                var response = await client.PostAsync(
                    "https://api.openai.com/v1/responses",
                    content
                );

                var responseContent = await response.Content.ReadAsStringAsync();

                if (!response.IsSuccessStatusCode)
                    return Results.Json(new { error = responseContent }, statusCode: (int)response.StatusCode);

                return Results.Ok(JsonSerializer.Deserialize<object>(responseContent));
            }
            catch (HttpRequestException ex)
            {
                return Results.Json(new { error = ex.Message }, statusCode: 500);
            }
        });

        return group;
    }
    public record ChatRequest(string Message);
}
