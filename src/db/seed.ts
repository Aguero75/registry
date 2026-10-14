import { maskPhone, normalizePhone } from "@/lib/phone";

export function buildSeedRecords() {
  return Array.from({ length: 25 }, (_, index) => {
    const phone = normalizePhone(`+2348${(1000000 + index).toString().slice(1, 10)}`);
    return {
      id: `seed-${index + 1}`,
      name: `Person ${index + 1}`,
      phone,
      phoneMasked: maskPhone(phone),
      serialNumber: `REG-${String(index + 1).padStart(4, "0")}`,
      fileKey: `seed-file-${index + 1}`,
      fileUrl: `https://example.com/files/${index + 1}.pdf`,
      fileName: `record-${index + 1}.pdf`,
      fileSize: 700 * 1024,
      fileType: "application/pdf",
      createdAt: new Date(Date.now() - index * 86400000),
      updatedAt: new Date(Date.now() - index * 86400000),
    };
  });
}
