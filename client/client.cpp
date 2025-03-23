
// network

std::string cbyte::utils::configs::Upload(const std::string& configData, const std::string& gameName, int ping) {
	const std::string AUTH_TOKEN = OBFUSCATE_STR("3daXadKo23axfKLax_XKlx1Q13MjddaASSD");

	if (!rateLimiter.allowRequest()) {
		std::cerr << OBFUSCATE_STR("Rate limit exceeded. Please try again later.") << std::endl;
		return "";
	}

	httplib::Client cli(OBFUSCATE_STR("http://localhost:3000"));

	JSON payload;
	payload[OBFUSCATE_STR("config")] = JSON::parse(configData);
	payload[OBFUSCATE_STR("gameName")] = gameName;
	payload[OBFUSCATE_STR("ping")] = ping;

	httplib::Headers headers = {
		{ OBFUSCATE_STR("Authorization"), OBFUSCATE_STR("Bearer ") + AUTH_TOKEN }
	};

	auto res = cli.Post(OBFUSCATE_STR("/upload"), headers, payload.dump(), OBFUSCATE_STR("application/json"));

	if (res && res->status == 200) {
		auto response = JSON::parse(res->body);
		return response[OBFUSCATE_STR("code")];
	}
	else {
		std::cerr << OBFUSCATE_STR("Error uploading config: ") << (res ? res->status : 0) << std::endl;
		return "";
	}
}


std::string cbyte::utils::configs::Download(const std::string& configCode) {
	httplib::Client cli("http://localhost:3000");

	std::string url = "/download/" + configCode;
	auto res = cli.Get(url.c_str());

	if (res && res->status == 200) {
		try {
			auto response = JSON::parse(res->body);
			if (response.contains("config")) {
				return response["config"].dump();
			}
			else {
				std::cerr << "Config key not found in the response." << std::endl;
				return "";
			}
		}
		catch (const std::exception& e) {
			std::cerr << "Error parsing JSON response: " << e.what() << std::endl;
			return "";
		}
	}
	else {
		std::cerr << "Error downloading config: " << (res ? res->status : 0) << std::endl;
		return "";
	}
}



// configs.cpp

void cbyte::utils::configs::loadFromCloud(const char* code) {
    std::cout << "[cloud-handler] -> Loading from cloud with code: " << code << std::endl;
    std::string configData = cbyte::utils::configs::Download(code);

    if (!configData.empty()) {
        std::cout << "[cloud-handler] -> Config data downloaded: " << configData << std::endl;
        json response = json::parse(configData);
        if (response.contains("config")) {
            json config = response["config"];

            loadConfigOption<bool>(globals::esp, config, "esp");

            if (config.contains("nigga_colors")) {
                auto& col = config["nigga_colors"];
                globals::nigga_colors[0] = col.at(0);
                globals::nigga_colors[1] = col.at(1);
                globals::nigga_colors[2] = col.at(2);
            }
        }
        else {
            std::cerr << "[cloud-handler] -> Config key not found in the response." << std::endl;
        }
    }
    else {
        std::cerr << "[cloud-handler] -> Failed to download configuration." << std::endl;
    }
}



std::string cbyte::utils::configs::saveToCloud(const char* name, const std::string& gameName, int ping) {
    json config;
    config["esp"] = globals::esp;

    // etc etc

    std::string configData = config.dump();
    std::string configCode = cbyte::utils::configs::Upload(configData, gameName, ping);

    if (!configCode.empty()) {
        std::cout << "Configuration uploaded successfully. Use code: " << configCode << std::endl;
    }
    else {
        std::cout << "Failed to upload configuration." << std::endl;
    }


    return configCode;
}
