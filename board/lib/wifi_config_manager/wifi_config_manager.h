#pragma once
#include <Arduino.h>
#include "wifi_config.h"

namespace wifi_config_manager {
#if defined(UNIT_TEST) || defined(PIO_UNIT_TESTING)
  constexpr const char *CONFIG_PATH = "/wifi.test.json";
#else
  constexpr const char *CONFIG_PATH = "/wifi.json";
#endif

  bool readCredentials(WifiCredentials &creds);
  bool writeCredentials(const WifiCredentials &creds);
  bool credentialsExist();
}
