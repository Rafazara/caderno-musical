"use client";

/**
 * Leitura de arquivos para data URL.
 *
 * O localStorage tem cerca de 5 MB por origem — pouco para fotos de celular,
 * que hoje passam facilmente de 3 MB cada. Por isso imagens são
 * **redimensionadas e recomprimidas** antes de guardar: uma foto de partitura
 * a 1400 px de largura e JPEG 75% fica legível e cabe em algumas centenas de
 * KB, o que permite dezenas de materiais em vez de um só.
 *
 * PDFs não podem ser recomprimidos aqui, então são apenas verificados e
 * recusados acima do limite, com mensagem explícita.
 */

export const ACCEPTED_TYPES = ["image/jpeg", "image/png", "image/webp", "application/pdf"];
export const ACCEPT_ATTR = ".jpg,.jpeg,.png,.webp,.pdf";

/** Largura máxima após o redimensionamento. */
const MAX_DIMENSION = 1400;
const JPEG_QUALITY = 0.75;
/** Teto para PDFs, que não conseguimos recomprimir. */
const MAX_PDF_BYTES = 2.5 * 1024 * 1024;

export type PreparedFile = {
  dataUrl: string;
  fileName: string;
  fileType: string;
  /** Tamanho aproximado do que será gravado, em bytes. */
  fileSize: number;
};

export class FileRejected extends Error {}

function readAsDataUrl(file: File | Blob): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result as string);
    reader.onerror = () => reject(new FileRejected("Não foi possível ler o arquivo."));
    reader.readAsDataURL(file);
  });
}

/** Bytes que um data URL base64 ocupa depois de gravado. */
function dataUrlBytes(dataUrl: string): number {
  const base64 = dataUrl.slice(dataUrl.indexOf(",") + 1);
  return Math.floor(base64.length * 0.75);
}

function loadImage(src: string): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.onload = () => resolve(img);
    img.onerror = () => reject(new FileRejected("A imagem não pôde ser aberta."));
    img.src = src;
  });
}

async function compressImage(file: File): Promise<PreparedFile> {
  const original = await readAsDataUrl(file);
  const img = await loadImage(original);

  const scale = Math.min(1, MAX_DIMENSION / Math.max(img.width, img.height));
  const width = Math.round(img.width * scale);
  const height = Math.round(img.height * scale);

  const canvas = document.createElement("canvas");
  canvas.width = width;
  canvas.height = height;

  const ctx = canvas.getContext("2d");
  if (!ctx) throw new FileRejected("O navegador não conseguiu processar a imagem.");

  // Fundo branco: PNGs com transparência viram JPEG e o alfa precisa de base.
  ctx.fillStyle = "#ffffff";
  ctx.fillRect(0, 0, width, height);
  ctx.drawImage(img, 0, 0, width, height);

  const compressed = canvas.toDataURL("image/jpeg", JPEG_QUALITY);

  // Se a recompressão não ajudou (imagem já pequena), mantém a original.
  const useCompressed = dataUrlBytes(compressed) < dataUrlBytes(original);
  const dataUrl = useCompressed ? compressed : original;

  return {
    dataUrl,
    fileName: file.name,
    fileType: useCompressed ? "image/jpeg" : file.type,
    fileSize: dataUrlBytes(dataUrl),
  };
}

export async function prepareFile(file: File): Promise<PreparedFile> {
  if (!ACCEPTED_TYPES.includes(file.type)) {
    throw new FileRejected("Formato não aceito. Use JPG, PNG, WEBP ou PDF.");
  }

  if (file.type === "application/pdf") {
    if (file.size > MAX_PDF_BYTES) {
      throw new FileRejected(
        `Este PDF tem ${(file.size / 1024 / 1024).toFixed(1)} MB. Como o caderno guarda tudo no próprio navegador, o limite para PDF é 2,5 MB — tente exportar em qualidade menor ou enviar as páginas como imagem.`,
      );
    }
    const dataUrl = await readAsDataUrl(file);
    return {
      dataUrl,
      fileName: file.name,
      fileType: file.type,
      fileSize: dataUrlBytes(dataUrl),
    };
  }

  return compressImage(file);
}
