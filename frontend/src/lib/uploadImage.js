const DEFAULT_BACKEND_URL = import.meta.env.VITE_BACKEND_URL || 'http://localhost:3001'

export async function uploadImage({ file, bucket, path }) {
  const fileBase64 = await fileToBase64(file)

  let response

  try {
    response = await fetch(`${DEFAULT_BACKEND_URL}/api/storage/upload-image`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        bucket,
        path,
        fileBase64,
        contentType: file.type,
        upsert: true,
      }),
    })
  } catch (error) {
    throw new Error(`No se pudo conectar al backend en ${DEFAULT_BACKEND_URL}. Verifica que esté levantado en ese puerto.`)
  }

  const payload = await response.json().catch(() => ({}))

  if (!response.ok) {
    throw new Error(payload.error || `Error ${response.status}`)
  }

  return payload.publicUrl
}

function fileToBase64(file) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader()
    reader.onload = () => {
      const result = String(reader.result || '')
      const base64 = result.includes(',') ? result.split(',')[1] : result
      resolve(base64)
    }
    reader.onerror = () => reject(new Error('No se pudo leer el archivo'))
    reader.readAsDataURL(file)
  })
}
