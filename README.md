# Cloud Config System

The Cloud Config System is a lightweight configuration management solution that allows users to upload, download, and manage configuration files in a cloud environment. The system provides both a web interface—with Discord OAuth authentication and webhook notifications—and a RESTful API for programmatic access. A C++ client demonstrates how to integrate with the server for uploading and downloading configurations.

## Features

- **Web Interface & Authentication**
  - Secure login using Discord OAuth.
  - Upload configurations via a user-friendly web form.
  - Real-time notifications sent to Discord via webhook upon new uploads.

- **API Endpoints**
  - RESTful endpoints for uploading configurations using a Bearer Token.
  - Download and retrieve configuration files by their unique code.
  - Rate limiting to prevent abuse (5 uploads per hour per IP).

- **Client Integration**
  - A C++ client provides functions to upload and download configuration data.
  - Example functions include `Upload`, `Download`, `saveToCloud`, and `loadFromCloud` for easy integration into other projects.

## Project Structure

```
├── server.js            # Node.js/Express server handling API endpoints and web routes (see :contentReference[oaicite:0]{index=0}&#8203;:contentReference[oaicite:1]{index=1})
├── client.cpp           # C++ client demonstrating cloud config upload/download (see :contentReference[oaicite:2]{index=2}&#8203;:contentReference[oaicite:3]{index=3})
├── configs/             # Directory where configuration JSON files are stored
└── public/              # Static files served for the web interface
```

## Requirements

### Server
- Node.js (v12+)
- npm (Node Package Manager)

**Dependencies:**
- Express
- body-parser
- uuid
- axios
- express-rate-limit
- express-session
- multer

### Client
- C++11 (or later)
- HTTP client library (e.g., [cpp-httplib](https://github.com/yhirose/cpp-httplib))
- JSON library (e.g., [nlohmann/json](https://github.com/nlohmann/json))

## Installation

### Server Setup

1. **Clone the Repository:**

   ```bash
   git clone <repository-url>
   cd <repository-directory>
   ```

2. **Install Dependencies:**

   ```bash
   npm install
   ```

3. **Configure Environment:**
   - Update `DISCORD_CLIENT_ID`, `DISCORD_CLIENT_SECRET`, and `DISCORD_REDIRECT_URI` in `server.js` with your Discord application credentials.
   - Modify `DISCORD_WEBHOOK_URL` if you want to change where notifications are sent.
   - Optionally, change the `BEARER_TOKEN` used for API authentication.
   - **Note:** The session secret is set to a placeholder value ("nigaboy")—replace it with a secure string for production.

4. **Run the Server:**

   ```bash
   node server.js
   ```

   The server will start on `http://localhost:3000`.

### Client Setup

1. **Compile the Client:**
   - Ensure you have a C++ compiler that supports C++11 or later.
   - Compile the client code. For example, using `g++`:
     ```bash
     g++ client.cpp -o cloud_config_client -std=c++11
     ```

2. **Run the Client:**

   ```bash
   ./cloud_config_client
   ```

## Usage

### Web Interface

- Open your browser and navigate to `http://localhost:3000`.
- Click on the login button to authenticate via Discord.
- Use the provided form to upload a JSON configuration file along with metadata (such as game name and ping).
- The configuration is saved on the server (in the `configs/` directory) and a notification is sent via Discord webhook.

### API Endpoints

- **Upload Configuration (API):**
  - **Endpoint:** `POST /upload`
  - **Headers:**  
    `Authorization: Bearer <BEARER_TOKEN>`
  - **Body (JSON):**
    ```json
    {
      "config": { /* JSON configuration data */ },
      "gameName": "YourGame",
      "ping": 50
    }
    ```
  - **Response:**
    ```json
    { "code": "unique-config-code" }
    ```

- **Download Configuration:**
  - **Endpoint:** `GET /download/:configCode`
  - **Response:**
    ```json
    { "config": { /* JSON configuration data */ } }
    ```

- **Additional Endpoints:**
  - `GET /configs` to list all configuration summaries.
  - `GET /config/:configCode` for detailed configuration info.

### C++ Client Integration

The provided `client.cpp` demonstrates how to integrate with the Cloud Config System:

- **Uploading a Configuration:**
  - The `cbyte::utils::configs::Upload` function takes JSON configuration data, game name, and ping as parameters and returns a unique configuration code.
  
- **Downloading a Configuration:**
  - The `cbyte::utils::configs::Download` function retrieves the configuration data using the unique configuration code.

- **Example Usage in Client Code:**
  - Functions `saveToCloud` and `loadFromCloud` wrap the upload/download functionality, integrating the configuration into your application settings.

## Security & Rate Limiting

- **Rate Limiting:** The server enforces a limit of 5 uploads per hour per IP to prevent abuse.
- **Authentication:**
  - Web uploads require Discord OAuth authentication.
  - API uploads are secured via a Bearer Token.

## Customization

- **Session Secret:** Replace the default session secret in `server.js` with a secure value.
- **Webhook URL:** Adjust the Discord webhook URL to fit your notification channel.
- **Configuration Directory:** Ensure the `configs/` directory is properly writable by the server.

## License

This project is released under the MIT License..

## Contributing

Contributions, bug fixes, and feature enhancements are welcome! Feel free to fork the repository and submit a pull request with your changes.

## Acknowledgements

- Built with [Express](https://expressjs.com/) and Node.js.
- OAuth integration via [Discord API](https://discord.com/developers/docs/intro).
- C++ client demonstrates integration using HTTP libraries and JSON handling.

*References: Server implementation in server.js :contentReference[oaicite:4]{index=4}&#8203;:contentReference[oaicite:5]{index=5}; Client integration in client.cpp :contentReference[oaicite:6]{index=6}&#8203;:contentReference[oaicite:7]{index=7}.*
