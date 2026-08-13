/*
============================================================
ADAREET v2.6
AI / PROVIDERS
============================================================
Provider registry

หน้าที่:
- รวม provider ทั้งหมดไว้จุดเดียว
- ไม่ให้ส่วนอื่นของระบบ import provider โดยตรง
- รองรับการเพิ่ม provider ใหม่ภายหลัง
============================================================
*/

import { generate as mockGenerate } from "./mock.js";

export const PROVIDERS = {
  mock: {
    name: "mock",
    generate: mockGenerate
  }
};

export function getProvider(name) {
  return PROVIDERS[name] || null;
}

export function listProviders() {
  return Object.keys(PROVIDERS);
}
