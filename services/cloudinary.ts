export async function uploadImage(file: File): Promise<string> {
  const formData = new FormData();

  formData.append("file", file);
  formData.append("upload_preset", "sentinela_upload");
  formData.append("folder", "sentinela-360");

  const response = await fetch(
    "https://api.cloudinary.com/v1_1/dpucfpvbp/image/upload",
    {
      method: "POST",
      body: formData,
    },
  );

  if (!response.ok) {
    throw new Error("Erro ao enviar imagem para o Cloudinary.");
  }

  const data = await response.json();

  return data.secure_url as string;
}
