#include <Arduino.h>
#include <DHT.h>

// 🟡 Määritä käytetty GPIO-pin (esim. DHT22 signaalijohto)
#define DHTPIN 5        // GPIO4 (voi vaihtaa tarpeen mukaan)
#define DHTTYPE DHT11   // Muuta DHT11:ksi jos käytät sitä

DHT dht(DHTPIN, DHTTYPE);

void setup() {
  Serial.begin(115200);
  delay(2000);
  Serial.println("Starting DHT22 sensor...");
  dht.begin();
}

void loop() {
  float humidity = dht.readHumidity();
  float temperature = dht.readTemperature();
  Serial.printf("Humidity: %.1f %%\tTemperature: %.1f °C\n", humidity, temperature);

  if (isnan(temperature)) {
    Serial.println("Failed to read from DHT sensor!");
  } else {
    Serial.printf("Temperature: %.1f °C\tHumidity: %.1f %%\n", temperature, humidity);
  }

  delay(2000);  // Lue dataa 2 sekunnin välein
}
