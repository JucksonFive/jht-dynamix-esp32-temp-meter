#pragma once
#include <WiFiClientSecure.h>

namespace CertHelper {
  void loadCerts(WiFiClientSecure& client); 
}