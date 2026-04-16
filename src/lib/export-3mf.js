import { strToU8, zipSync } from "fflate";

function createModelXml(meshes) {
  const resources = meshes
    .map((mesh, index) => {
      const objectId = index + 1;
      const vertices = mesh.vertices
        .map((vertex) => `<vertex x="${vertex.x}" y="${vertex.y}" z="${vertex.z}" />`)
        .join("");
      const triangles = mesh.faces
        .map(
          (face) =>
            `<triangle v1="${face[0]}" v2="${face[1]}" v3="${face[2]}" />`,
        )
        .join("");

      return [
        `<object id="${objectId}" name="${mesh.name}" type="model">`,
        "<mesh>",
        `<vertices>${vertices}</vertices>`,
        `<triangles>${triangles}</triangles>`,
        "</mesh>",
        "</object>",
      ].join("");
    })
    .join("");

  const buildItems = meshes
    .map((_, index) => `<item objectid="${index + 1}" />`)
    .join("");

  return [
    '<?xml version="1.0" encoding="UTF-8"?>',
    '<model unit="millimeter" xml:lang="ja-JP" xmlns="http://schemas.microsoft.com/3dmanufacturing/core/2015/02">',
    `<resources>${resources}</resources>`,
    `<build>${buildItems}</build>`,
    "</model>",
  ].join("");
}

export function create3mfBlob(meshes) {
  const archive = {
    "3D/3dmodel.model": strToU8(createModelXml(meshes)),
    "[Content_Types].xml": strToU8(
      [
        '<?xml version="1.0" encoding="UTF-8"?>',
        '<Types xmlns="http://schemas.openxmlformats.org/package/2006/content-types">',
        '<Default Extension="model" ContentType="application/vnd.ms-package.3dmanufacturing-3dmodel+xml"/>',
        "</Types>",
      ].join(""),
    ),
    "_rels/.rels": strToU8(
      [
        '<?xml version="1.0" encoding="UTF-8"?>',
        '<Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships">',
        '<Relationship Target="/3D/3dmodel.model" Id="rel0" Type="http://schemas.microsoft.com/3dmanufacturing/2013/01/3dmodel"/>',
        "</Relationships>",
      ].join(""),
    ),
  };

  return new Blob([zipSync(archive, { level: 0 })], { type: "model/3mf" });
}
