/// <reference path="../pb_data/types.d.ts" />

// Machine codes are printed on QR stickers, so they are normalized to
// uppercase on create and cannot be changed afterwards.

onRecordCreate((e) => {
  e.record.set("code", e.record.getString("code").trim().toUpperCase());
  e.next();
}, "machines");

onRecordUpdate((e) => {
  const before = e.record.original().getString("code");
  if (e.record.getString("code") !== before) {
    throw new BadRequestError(
      `Machine code "${before}" is printed on its QR sticker and cannot be changed. Create a new machine instead.`
    );
  }
  e.next();
}, "machines");
