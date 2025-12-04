#include "offline_sync_helper.h"
#include <LittleFS.h>

const char *OfflineSyncHelper::QUEUE_FILE = "/offline_queue.json";

bool OfflineSyncHelper::createQueueFile()
{
    File file = LittleFS.open(QUEUE_FILE, "w");
    if (!file)
    {
        Serial.println("[Offline] Failed to create queue file");
        return false;
    }

    file.print("{\"events\":[]}");
    file.close();
    Serial.println("[Offline] Created offline_queue.json");
    return true;
}

bool OfflineSyncHelper::begin()
{
    // LittleFS on jo mountattu main.cpp:ssä, ei tarvitse mountata uudelleen

    // Tarkista tiedostokoko ja tyhjennä tarvittaessa
    if (LittleFS.exists(QUEUE_FILE))
    {
        File file = LittleFS.open(QUEUE_FILE, "r");
        if (file.size() > MAX_FILE_SIZE)
        {
            file.close();
            LittleFS.remove(QUEUE_FILE);
            Serial.println("[Offline] Queue file too large, purged");
        }
        else
        {
            file.close();
        }
    }

    if (!LittleFS.exists(QUEUE_FILE))
    {
        return createQueueFile();
    }

    return true;
}

bool OfflineSyncHelper::queueEvent(const char *topic, const char *payload, unsigned long timestamp)
{
    JsonDocument queueDoc;

    // Lataa olemassa oleva jono
    if (LittleFS.exists(QUEUE_FILE))
    {
        if (!loadQueue(queueDoc))
        {
            Serial.println("Failed to load queue");
            queueDoc.clear();
        }
    }

    // Tarkista jonon koko
    JsonArray events = queueDoc["events"].as<JsonArray>();
    if (events.isNull())
    {
        events = queueDoc["events"].to<JsonArray>();
    }

    if (events.size() >= MAX_QUEUE_SIZE)
    {
        Serial.println("Queue full, dropping oldest event");
        events.remove(0);
    }

    // Lisää uusi tapahtuma
    JsonObject newEvent = events.add<JsonObject>();
    newEvent["topic"] = topic;
    newEvent["payload"] = payload;
    newEvent["timestamp"] = timestamp;
    newEvent["queued_at"] = millis();

    return appendToQueue(queueDoc);
}

bool OfflineSyncHelper::syncPendingEvents(bool (*sendCallback)(const char *, const char *))
{
    Serial.println("[Sync] Starting sync...");

    if (!hasPendingEvents())
    {
        Serial.println("[Sync] No pending events");
        return true;
    }

    JsonDocument queueDoc;
    if (!loadQueue(queueDoc))
    {
        Serial.println("[Sync] Failed to load queue for sync");
        return false;
    }

    JsonArray events = queueDoc["events"].as<JsonArray>();
    if (events.isNull())
    {
        Serial.println("[Sync] Events array is null");
        return true;
    }

    if (events.size() == 0)
    {
        Serial.println("[Sync] Events array is empty");
        return true;
    }

    Serial.printf("[Sync] Found %d pending events, starting sync...\n", events.size());

    JsonDocument remainingDoc;
    JsonArray remaining = remainingDoc["events"].to<JsonArray>();

    int successCount = 0;
    int failCount = 0;

    for (JsonVariant event : events)
    {
        const char *topic = event["topic"];
        const char *payload = event["payload"];

        Serial.printf("[Sync] Processing event - topic: %s\n", topic);

        if (sendCallback(topic, payload))
        {
            successCount++;
            Serial.printf("[Sync] ✅ Synced successfully: %s\n", topic);
        }
        else
        {
            failCount++;
            Serial.printf("[Sync] ❌ Failed to sync: %s\n", topic);
            remaining.add(event); // Pidä epäonnistuneet jonossa
        }

        yield(); // Anna aikaa muille tehtäville
    }

    Serial.printf("[Sync] Sync complete: %d success, %d failed\n", successCount, failCount);

    // Päivitä jono
    if (remaining.size() > 0)
    {
        Serial.printf("[Sync] Keeping %d failed events in queue\n", remaining.size());
        return appendToQueue(remainingDoc);
    }
    else
    {
        Serial.println("[Sync] All events synced, clearing queue");
        return clearQueue();
    }
}

bool OfflineSyncHelper::hasPendingEvents()
{
    if (!LittleFS.exists(QUEUE_FILE))
    {
        return false;
    }

    JsonDocument queueDoc;
    if (!loadQueue(queueDoc))
    {
        return false;
    }

    JsonArray events = queueDoc["events"].as<JsonArray>();
    return !events.isNull() && events.size() > 0;
}

size_t OfflineSyncHelper::getPendingCount()
{
    if (!hasPendingEvents())
    {
        return 0;
    }

    JsonDocument queueDoc;
    if (!loadQueue(queueDoc))
    {
        return 0;
    }

    JsonArray events = queueDoc["events"].as<JsonArray>();
    return events.size();
}

bool OfflineSyncHelper::appendToQueue(const JsonDocument &doc)
{
    File file = LittleFS.open(QUEUE_FILE, "w");
    if (!file)
    {
        Serial.println("Failed to open queue file for writing");
        return false;
    }

    size_t bytesWritten = serializeJson(doc, file);
    file.close();

    return bytesWritten > 0;
}

bool OfflineSyncHelper::loadQueue(JsonDocument &doc)
{
    File file = LittleFS.open(QUEUE_FILE, "r");
    if (!file)
    {
        return false;
    }

    DeserializationError error = deserializeJson(doc, file);
    file.close();

    if (error)
    {
        Serial.printf("Failed to parse queue: %s\n", error.c_str());
        return false;
    }

    return true;
}

bool OfflineSyncHelper::clearQueue()
{
    if (LittleFS.exists(QUEUE_FILE))
    {
        LittleFS.remove(QUEUE_FILE);
    }

    return createQueueFile();
}