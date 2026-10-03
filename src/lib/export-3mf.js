import { strToU8, zipSync } from "fflate";
import { format3mfColor } from "./color-utils.js";

const MATERIALS_NAMESPACE = "http://schemas.microsoft.com/3dmanufacturing/material/2015/02";
const COLOR_GROUP_RESOURCE_ID = 1000;
const DEFAULT_ASSEMBLY_OBJECT_NAME = "keycap";

function escapeXmlAttribute(value) {
  return String(value)
    .replaceAll("&", "&amp;")
    .replaceAll("\"", "&quot;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;");
}

function formatPartName(meshName, index) {
  const name = String(meshName ?? "").trim();
  return name.replace(/^keycap[-_]/i, "") || `part-${index + 1}`;
}

function formatAssemblyObjectName(name) {
  return String(name ?? "").trim() || DEFAULT_ASSEMBLY_OBJECT_NAME;
}

function resolveCreate3mfOptions(options = {}) {
  if (typeof options === "string") {
    return {
      assemblyName: formatAssemblyObjectName(options),
    };
  }

  return {
    assemblyName: formatAssemblyObjectName(options.assemblyName),
  };
}

function createBambuModelSettingsXml(meshes, assemblyName) {
  const assemblyObjectId = meshes.length + 1;
  const parts = meshes
    .map((mesh, index) => {
      const objectId = index + 1;
      const name = escapeXmlAttribute(formatPartName(mesh.name, index));

      return [
        `    <part id="${objectId}" subtype="normal_part">`,
        `      <metadata key="name" value="${name}"/>`,
        "    </part>",
      ].join("\n");
    })
    .join("\n");

  return [
    '<?xml version="1.0" encoding="UTF-8"?>',
    "<config>",
    `  <object id="${assemblyObjectId}">`,
    `    <metadata key="name" value="${escapeXmlAttribute(assemblyName)}"/>`,
    parts,
    "  </object>",
    "</config>",
  ].join("\n");
}

function createSlic3rPeModelSettingsXml(meshes) {
  const objects = meshes
    .map((mesh, index) => {
      const objectId = index + 1;
      const name = escapeXmlAttribute(formatPartName(mesh.name, index));
      const lastTriangleId = Math.max(mesh.faces.length - 1, 0);

      return [
        ` <object id="${objectId}" instances_count="1">`,
        `  <metadata type="object" key="name" value="${name}"/>`,
        `  <volume firstid="0" lastid="${lastTriangleId}">`,
        `   <metadata type="volume" key="name" value="${name}"/>`,
        '   <metadata type="volume" key="volume_type" value="ModelPart"/>',
        '   <mesh edges_fixed="0" degenerate_facets="0" facets_removed="0" facets_reversed="0" backwards_edges="0"/>',
        "  </volume>",
        " </object>",
      ].join("\n");
    })
    .join("\n");

  return [
    '<?xml version="1.0" encoding="UTF-8"?>',
    "<config>",
    objects,
    "</config>",
  ].join("\n");
}

function createModelXml(meshes, assemblyName, assemblies = null) {
  if (meshes.length === 0) {
    throw new Error("3MF に含めるメッシュがありません。");
  }

  const colorResources = meshes
    .map((mesh) => format3mfColor(mesh.colorHex))
    .map((colorHex) => `<m:color color="${colorHex}" />`)
    .join("");

  const colorResourceId = assemblies ? meshes.length + assemblies.length + 1 : COLOR_GROUP_RESOURCE_ID;
  const partResources = meshes
    .map((mesh, index) => {
      const objectId = index + 1;
      const meshName = escapeXmlAttribute(mesh.name);
      const partName = escapeXmlAttribute(formatPartName(mesh.name, index));
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
        `<object id="${objectId}" name="${meshName}" partnumber="${partName}" type="model" pid="${colorResourceId}" pindex="${index}">`,
        "<mesh>",
        `<vertices>${vertices}</vertices>`,
        `<triangles>${triangles}</triangles>`,
        "</mesh>",
        "</object>",
      ].join("");
    })
    .join("");

  const assemblyObjectId = meshes.length + 1;
  const components = meshes
    .map((_, index) => `<component objectid="${index + 1}" />`)
    .join("");
  const assemblyResource = [
    `<object id="${assemblyObjectId}" name="${escapeXmlAttribute(assemblyName)}" type="model">`,
    `<components>${components}</components>`,
    "</object>",
  ].join("");
  const groupedResources = assemblies?.map((assembly, index) =>
    `<object id="${meshes.length + index + 1}" name="${escapeXmlAttribute(assembly.name)}" type="model"><components>${assembly.indices.map((i) => `<component objectid="${i + 1}" />`).join("")}</components></object>`).join("");
  const build = assemblies ? assemblies.map((_, index) => `<item objectid="${meshes.length + index + 1}" />`).join("") : `<item objectid="${assemblyObjectId}" />`;

  return [
    '<?xml version="1.0" encoding="UTF-8"?>',
    `<model unit="millimeter" xml:lang="ja-JP" xmlns="http://schemas.microsoft.com/3dmanufacturing/core/2015/02" xmlns:m="${MATERIALS_NAMESPACE}">`,
    `<resources><m:colorgroup id="${colorResourceId}">${colorResources}</m:colorgroup>${partResources}${groupedResources ?? assemblyResource}</resources>`,
    `<build>${build}</build>`,
    "</model>",
  ].join("");
}

export function create3mfBlob(meshes, options = {}) {
  const { assemblyName } = resolveCreate3mfOptions(options);
  return package3mf(createModelXml(meshes, assemblyName),
    createBambuModelSettingsXml(meshes, assemblyName), createSlic3rPeModelSettingsXml(meshes));
}

export function createGrouped3mfBlob(groups) {
  if (!groups.length || groups.some((group) => !group.meshes.length)) throw new Error("3MF に含めるメッシュがありません。");
  const meshes = [], assemblies = groups.map((group) => ({ name: formatAssemblyObjectName(group.name),
    indices: group.meshes.map((mesh) => { meshes.push(mesh); return meshes.length - 1; }) }));
  const bambu = assemblies.map((assembly, index) => [
    `  <object id="${meshes.length + index + 1}">`,
    `    <metadata key="name" value="${escapeXmlAttribute(assembly.name)}"/>`,
    ...assembly.indices.map((i) => `    <part id="${i + 1}" subtype="normal_part"><metadata key="name" value="${escapeXmlAttribute(formatPartName(meshes[i].name, i))}"/></part>`),
    "  </object>",
  ].join("\n")).join("\n");
  const prusa = assemblies.map((assembly, index) => {
    let first = 0;
    const volumes = assembly.indices.map((i) => {
      const last = first + meshes[i].faces.length - 1;
      const xml = `<volume firstid="${first}" lastid="${last}"><metadata type="volume" key="name" value="${escapeXmlAttribute(formatPartName(meshes[i].name, i))}"/><metadata type="volume" key="volume_type" value="ModelPart"/></volume>`;
      first = last + 1;
      return xml;
    }).join("");
    return `<object id="${meshes.length + index + 1}" instances_count="1"><metadata type="object" key="name" value="${escapeXmlAttribute(assembly.name)}"/>${volumes}</object>`;
  }).join("");
  return package3mf(createModelXml(meshes, "", assemblies),
    `<?xml version="1.0" encoding="UTF-8"?><config>\n${bambu}\n</config>`,
    `<?xml version="1.0" encoding="UTF-8"?><config>${prusa}</config>`);
}

function package3mf(modelXml, bambuXml, prusaXml) {
  const archive = createPackageEntries();
  archive["3D/3dmodel.model"] = strToU8(modelXml);
  archive["Metadata/model_settings.config"] = strToU8(bambuXml);
  archive["Metadata/Slic3r_PE_model.config"] = strToU8(prusaXml);
  return new Blob([zipSync(archive, { level: 0 })], { type: "model/3mf" });
}

function createPackageEntries() {
  return {
    "[Content_Types].xml": strToU8('<?xml version="1.0" encoding="UTF-8"?><Types xmlns="http://schemas.openxmlformats.org/package/2006/content-types"><Default Extension="model" ContentType="application/vnd.ms-package.3dmanufacturing-3dmodel+xml"/></Types>'),
    "_rels/.rels": strToU8('<?xml version="1.0" encoding="UTF-8"?><Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships"><Relationship Target="/3D/3dmodel.model" Id="rel0" Type="http://schemas.microsoft.com/3dmanufacturing/2013/01/3dmodel"/></Relationships>'),
  };
}
