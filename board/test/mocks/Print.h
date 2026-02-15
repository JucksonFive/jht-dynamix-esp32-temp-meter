#pragma once
#include <cstddef>
#include <cstdint>
#include <cstring>

class Print
{
 public:
  virtual ~Print() = default;
  virtual size_t write(uint8_t) = 0;
  virtual size_t write(const uint8_t* buffer, size_t size)
  {
    size_t n = 0;
    while (size--)
      n += write(*buffer++);
    return n;
  }
  size_t write(const char* str)
  {
    if (!str)
      return 0;
    return write(reinterpret_cast<const uint8_t*>(str), strlen(str));
  }
  size_t write(const char* buffer, size_t size) { return write(reinterpret_cast<const uint8_t*>(buffer), size); }
  size_t print(const char* s)
  {
    if (!s)
      return 0;
    return write(reinterpret_cast<const uint8_t*>(s), strlen(s));
  }
  size_t print(char c) { return write(static_cast<uint8_t>(c)); }
  size_t println(const char* s = "")
  {
    size_t n = print(s);
    n += write(static_cast<uint8_t>('\n'));
    return n;
  }
};
