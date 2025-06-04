import { Effect, Context } from 'effect'
import { ToolbarsService } from '../ToolbarsService'

import { describe, it, expect, beforeEach } from 'vitest'

const sampleToolbar = { id: 'toolbar1', name: 'Main Toolbar', tools: [] }

describe('ToolbarsService', () => {
  it('creates and retrieves a toolbar', () => {
    const program = Effect.gen(function* () {
      const service = yield* ToolbarsService
      const toolbar = {
        id: 'test-toolbar',
        name: 'Test Toolbar',
        tools: []
      }
      yield* service.create(toolbar)
      const retrieved = yield* service.getById('test-toolbar')
      expect(retrieved._tag).toBe('Some')
      expect(retrieved.value).toEqual(toolbar)
    })
    return Effect.runPromise(Effect.provide(program, ToolbarsService.Default))
  })

  it('updates a toolbar', () => {
    const program = Effect.gen(function* () {
      const service = yield* ToolbarsService
      const toolbar = {
        id: 'test-toolbar',
        name: 'Test Toolbar',
        tools: []
      }
      yield* service.create(toolbar)
      
      const update = { name: 'Updated Toolbar' }
      yield* service.update('test-toolbar', update)
      
      const updated = yield* service.getById('test-toolbar')
      expect(updated._tag).toBe('Some')
      expect(updated.value).toEqual({ ...toolbar, ...update })
    })
    return Effect.runPromise(Effect.provide(program, ToolbarsService.Default))
  })

  it('deletes a toolbar', () => {
    const program = Effect.gen(function* () {
      const service = yield* ToolbarsService
      const toolbar = {
        id: 'test-toolbar',
        name: 'Test Toolbar',
        tools: []
      }
      yield* service.create(toolbar)
      yield* service.delete('test-toolbar')
      
      const deleted = yield* service.getById('test-toolbar')
      expect(deleted._tag).toBe('None')
    })
    return Effect.runPromise(Effect.provide(program, ToolbarsService.Default))
  })

  it('lists all toolbars', () => {
    const program = Effect.gen(function* () {
      const service = yield* ToolbarsService
      const toolbars = [
        { id: 'toolbar-1', name: 'Toolbar 1', tools: [] },
        { id: 'toolbar-2', name: 'Toolbar 2', tools: [] },
        { id: 'toolbar-3', name: 'Toolbar 3', tools: [] }
      ]
      
      for (const toolbar of toolbars) {
        yield* service.create(toolbar)
      }
      
      const all = yield* service.getAll()
      expect(all).toHaveLength(3)
      expect(all).toEqual(expect.arrayContaining(toolbars))
    })
    return Effect.runPromise(Effect.provide(program, ToolbarsService.Default))
  })
})
