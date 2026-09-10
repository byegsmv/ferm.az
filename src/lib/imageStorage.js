import { prisma } from "@/lib/prisma";
import { parseProxyImageId } from "@/lib/imageUrl";

// Gələn images massivini "təhlükəsiz" hala gətirir — iki kök problemi həll edir:
//
// 1) PROXY İSTİNADLARI (data loss bug): formalar API cavabından gələn
//    "/api/img/<id>" yollarını geri göndərirlər. PATCH əvvəlki şəkil qeydlərini
//    silib yenidən yaradır — həll edilməsə, yeni qeyd artıq mövcud olmayan
//    qeydə işarə edir və şəkil 404 düşür (datanın özü silinir).
//    Həll: istinad id-ləri mövcud qeydlərin ƏSL url-ləri ilə əvəz olunur.
//
// 2) BASE64 KÖÇÜRÜLMƏSİ (Neon egress): data: URI kimi göndərilən şəkillər
//    Vercel Blob-a yüklənib CDN url ilə əvəz olunur. Blob alınmadıqda
//    (token yoxdur vs.) base64 saxlanılır — əməliyyat HEÇ VAXT bloklanmır.
export async function normalizeIncomingImages(images, existingRows) {
  if (!Array.isArray(images) || images.length === 0) return images;

  var idMap = {};
  var rows = existingRows || [];
  for (var i = 0; i < rows.length; i++) {
    if (rows[i] && rows[i].id) idMap[rows[i].id] = rows[i].url;
  }

  var refIds = [];
  for (var j = 0; j < images.length; j++) {
    var refId = parseProxyImageId(images[j] && images[j].url);
    if (refId && !idMap[refId] && refIds.indexOf(refId) === -1) refIds.push(refId);
  }
  if (refIds.length) {
    try {
      var dbRows = await prisma.productImage.findMany({
        where: { id: { in: refIds } },
        select: { id: true, url: true },
      });
      for (var k = 0; k < dbRows.length; k++) idMap[dbRows[k].id] = dbRows[k].url;
    } catch (e) { /* DB xətası — istinadlar olduğu kimi qalır */ }
  }

  var resolved = [];
  for (var m = 0; m < images.length; m++) {
    var img = images[m];
    var target = parseProxyImageId(img && img.url);
    resolved.push(target && idMap[target] ? Object.assign({}, img, { url: idMap[target] }) : img);
  }

  // data: URI-ləri Vercel Blob-a köçür (uğursuzsa base64 qalır; bloklamır)
  var out = [];
  for (var n = 0; n < resolved.length; n++) {
    var item = resolved[n];
    if (item && typeof item.url === "string" && item.url.indexOf("data:") === 0) {
      var blobUrl = null;
      try {
        blobUrl = await migrateDataUriToBlob(item.url);
      } catch (e) { /* blob xətası — base64 saxla */ }
      out.push(blobUrl ? Object.assign({}, item, { url: blobUrl }) : item);
    } else {
      out.push(item);
    }
  }
  return out;
}

// "data:image/png;base64,XXXX" parçası — flag-sız, köhnə Node uyğun
function splitDataUri(url) {
  var marker = ";base64,";
  var idx = url.indexOf(marker);
  if (idx < 0) return null;
  return {
    contentType: url.slice(5, idx) || "image/png",
    base64: url.slice(idx + marker.length),
  };
}

async function migrateDataUriToBlob(dataUri) {
  if (!process.env.BLOB_READ_WRITE_TOKEN) return null;
  var parts = splitDataUri(dataUri);
  if (!parts || !parts.base64) return null;
  var mod = await import("@vercel/blob");
  if (!mod || typeof mod.put !== "function") return null;
  var buf = Buffer.from(parts.base64, "base64");
  var rawExt = (parts.contentType.split("/")[1] || "png");
  var ext = rawExt === "jpeg" ? "jpg" : rawExt;
  var key = "products/" + Date.now() + "-" + Math.random().toString(36).slice(2, 8) + "." + ext;
  var blob = await mod.put(key, buf, { contentType: parts.contentType, access: "public" });
  return blob && blob.url ? blob.url : null;
}
