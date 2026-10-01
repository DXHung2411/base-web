FROM mcr.microsoft.com/dotnet/sdk:8.0 AS build
WORKDIR /src
COPY src/CmsApi/CmsApi.csproj src/CmsApi/
RUN dotnet restore src/CmsApi/CmsApi.csproj
COPY src/CmsApi/ src/CmsApi/
RUN dotnet publish src/CmsApi/CmsApi.csproj -c Release -o /app --no-restore

FROM mcr.microsoft.com/dotnet/aspnet:8.0
WORKDIR /app
COPY --from=build /app .
# Uploaded files live in a volume so they survive container replacement.
RUN mkdir -p /app/uploads && chown -R app:app /app/uploads
USER app
ENV ASPNETCORE_URLS=http://+:8080 \
    Storage__UploadPath=/app/uploads
EXPOSE 8080
ENTRYPOINT ["dotnet", "CmsApi.dll"]
