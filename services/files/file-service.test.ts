import { describe, expect, it, vi } from 'vitest'
import { renameFile, replaceFile } from './file-service'

function client(overrides: Record<string, unknown> = {}) {
  return overrides as never
}

describe('renameFile', () => {
  it('rejects an empty name without hitting the database', async () => {
    const update = vi.fn()
    const result = await renameFile(client({ from: vi.fn(() => ({ update })) }), 'f1', '   ')
    expect(result.error).toBe('File name cannot be empty.')
    expect(update).not.toHaveBeenCalled()
  })

  it('trims and saves the new name', async () => {
    const eq = vi.fn().mockResolvedValue({ error: null })
    const update = vi.fn(() => ({ eq }))
    const from = vi.fn(() => ({ update }))
    const result = await renameFile(client({ from }), 'f1', '  Q3 report.pdf  ')
    expect(from).toHaveBeenCalledWith('files')
    expect(update).toHaveBeenCalledWith(expect.objectContaining({ name: 'Q3 report.pdf' }))
    expect(eq).toHaveBeenCalledWith('id', 'f1')
    expect(result.error).toBeNull()
  })

  it('surfaces a friendly error when the update fails', async () => {
    const eq = vi.fn().mockResolvedValue({ error: { message: 'denied' } })
    const from = vi.fn(() => ({ update: vi.fn(() => ({ eq })) }))
    const result = await renameFile(client({ from }), 'f1', 'New name')
    expect(result.error).toBe('Could not rename file.')
  })
})

describe('replaceFile', () => {
  const target = { id: 'f1', storageKey: 'ws/proj/abc-report.pdf', versionNumber: 1 }
  const newFile = { name: 'report.pdf', type: 'application/pdf', size: 1024 } as File

  it('rejects a replacement over the size limit without uploading', async () => {
    const upload = vi.fn()
    const oversized = { name: 'big.pdf', type: 'application/pdf', size: 52428801 } as File
    const result = await replaceFile(
      client({ storage: { from: vi.fn(() => ({ upload })) } }),
      target,
      oversized
    )
    expect(result.error).toBe('Files must be 50 MB or smaller.')
    expect(upload).not.toHaveBeenCalled()
  })

  it('uploads in place with upsert and increments the version number', async () => {
    const upload = vi.fn().mockResolvedValue({ error: null })
    const storageFrom = vi.fn(() => ({ upload }))
    const eq = vi.fn().mockResolvedValue({ error: null })
    const update = vi.fn(() => ({ eq }))
    const from = vi.fn(() => ({ update }))
    const result = await replaceFile(
      client({ storage: { from: storageFrom }, from }),
      target,
      newFile
    )
    expect(storageFrom).toHaveBeenCalledWith('project-files')
    expect(upload).toHaveBeenCalledWith(target.storageKey, newFile, {
      contentType: newFile.type,
      upsert: true,
    })
    expect(update).toHaveBeenCalledWith(
      expect.objectContaining({
        mime_type: 'application/pdf',
        size_bytes: 1024,
        version_number: 2,
      })
    )
    expect(eq).toHaveBeenCalledWith('id', 'f1')
    expect(result.error).toBeNull()
  })

  it('reports an upload failure without touching the file record', async () => {
    const upload = vi.fn().mockResolvedValue({ error: { message: 'denied' } })
    const from = vi.fn()
    const result = await replaceFile(
      client({ storage: { from: vi.fn(() => ({ upload })) }, from }),
      target,
      newFile
    )
    expect(result.error).toBe('Could not upload the replacement file.')
    expect(from).not.toHaveBeenCalled()
  })

  it('reports a record-update failure after a successful upload', async () => {
    const upload = vi.fn().mockResolvedValue({ error: null })
    const eq = vi.fn().mockResolvedValue({ error: { message: 'denied' } })
    const from = vi.fn(() => ({ update: vi.fn(() => ({ eq })) }))
    const result = await replaceFile(
      client({ storage: { from: vi.fn(() => ({ upload })) }, from }),
      target,
      newFile
    )
    expect(result.error).toBe('Replacement uploaded, but its record could not be updated.')
  })
})
