#pragma once
#include <Arduino.h>
#include "wifi_config.h"

namespace wifi_config_manager {
  inline constexpr const char *CONFIG_PATH = "/wifi.json";

  bool readCredentials(WifiCredentials &creds);
  bool writeCredentials(const WifiCredentials &creds);
  bool credentialsExist();
}
