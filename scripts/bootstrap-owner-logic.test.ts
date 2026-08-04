import { describe, it, expect } from 'vitest'
import { parseBootstrapArgs } from './bootstrap-owner-logic'

describe('parseBootstrapArgs', () => {
  it('parses email and role flags', () => {
    const result = parseBootstrapArgs(['--email=owner@himark.com', '--role=owner'])
    expect(result).toEqual({
      email: 'owner@himark.com',
      role: 'owner',
      firstName: undefined,
      lastName: undefined,
    })
  })

  it('defaults role to member when not provided', () => {
    const result = parseBootstrapArgs(['--email=person@himark.com'])
    expect(result).toEqual({
      email: 'person@himark.com',
      role: 'member',
      firstName: undefined,
      lastName: undefined,
    })
  })

  it('parses optional first-name and last-name flags', () => {
    const result = parseBootstrapArgs([
      '--email=person@himark.com',
      '--first-name=Neo',
      '--last-name=Matime',
    ])
    expect(result).toEqual({
      email: 'person@himark.com',
      role: 'member',
      firstName: 'Neo',
      lastName: 'Matime',
    })
  })

  it('throws when email is missing', () => {
    expect(() => parseBootstrapArgs([])).toThrow('--email is required')
  })

  it('throws when role is not a valid workspace_role', () => {
    expect(() => parseBootstrapArgs(['--email=x@himark.com', '--role=superadmin'])).toThrow(
      'invalid role'
    )
  })
})
