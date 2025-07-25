#include "cert_helper.h"
#include <FS.h>
#include <LittleFS.h>

void loadPem(WiFiClientSecure &client, const char *path, void (WiFiClientSecure::*setFunc)(const char *))
{
    File f = LittleFS.open(path);
    if (!f || f.isDirectory())
    {
        Serial.printf("❌ Failed to open cert file: %s\n", path);
        return;
    }

    size_t size = f.size();
    char *buf = (char *)malloc(size + 1);
    if (!buf)
    {
        Serial.println("❌ Failed to allocate memory for cert");
        f.close();
        return;
    }

    f.readBytes(buf, size);
    buf[size] = '\0';
    f.close();

    (client.*setFunc)(buf);
    Serial.printf("📄 Loaded: %s\n%s\n", path, buf);
}

void CertHelper::loadCerts(WiFiClientSecure &client)
{
    LittleFS.begin();

    loadPem(client, "/certs/AmazonRootCA1.pem", &WiFiClientSecure::setCACert);
    loadPem(client, "/certs/certificate.pem.crt", &WiFiClientSecure::setCertificate);
    loadPem(client, "/certs/private.pem.key", &WiFiClientSecure::setPrivateKey);
}

void CertHelper::attachRootCA(WiFiClientSecure &client)
{
    if (!LittleFS.begin())
    {
        Serial.println("❌ LittleFS mount failed");
        return;
    }

    loadPem(client, "/certs/AmazonRootCA1.pem", &WiFiClientSecure::setCACert);
}
