import { Effect } from "effect"
import { describe, expect, it } from "vitest"
import { AgentsService } from "../AgentsService"
import { AppsService } from "../AppsService"
import { ToolbarsService } from "../ToolbarsService"

describe('AppsService', () => {
  it('creates and retrieves an app', () => {
    const program = Effect.gen(function* () {
      // Get services
      const appsService = yield* AppsService
      const agentsService = yield* AgentsService
      const toolbarsService = yield* ToolbarsService
      
      // Create dependencies first
      const agent = { id: 'test-agent', initialAgentName: 'Test Agent' }
      yield* agentsService.create(agent)
      
      const toolbar = { id: 'test-toolbar', name: 'Test Toolbar', tools: [] }
      yield* toolbarsService.create(toolbar)
      
      // Create the app
      const app = {
        id: 'test-app',
        name: 'Test App',
        agentId: 'test-agent',
        toolbarId: 'test-toolbar'
      }
      yield* appsService.create(app)
      
      // Retrieve and verify
      const retrieved = yield* appsService.getById('test-app')
      expect(retrieved._tag).toBe('Some')
      expect(retrieved.value).toEqual(app)
    })
    
    // First provide the dependencies, then provide the AppsService
    return Effect.runPromise(
      Effect.provide(
        Effect.provide(
          Effect.provide(
            program,
            AgentsService.Default
          ),
          ToolbarsService.Default
        ),
        AppsService.Default
      )
    )
  })

  it('updates an app', () => {
    const program = Effect.gen(function* () {
      // Get services
      const appsService = yield* AppsService
      const agentsService = yield* AgentsService
      const toolbarsService = yield* ToolbarsService
      
      // Create dependencies first
      const agent = { id: 'test-agent', initialAgentName: 'Test Agent' }
      yield* agentsService.create(agent)
      
      const toolbar = { id: 'test-toolbar', name: 'Test Toolbar', tools: [] }
      yield* toolbarsService.create(toolbar)
      
      // Create the app
      const app = {
        id: 'test-app',
        name: 'Test App',
        agentId: 'test-agent',
        toolbarId: 'test-toolbar'
      }
      yield* appsService.create(app)
      
      // Update the app
      const update = { name: 'Updated App' }
      yield* appsService.update('test-app', update)
      
      // Retrieve and verify
      const retrieved = yield* appsService.getById('test-app')
      expect(retrieved._tag).toBe('Some')
      expect(retrieved.value).toEqual({ ...app, ...update })
    })
    
    return Effect.runPromise(
      Effect.provide(
        Effect.provide(
          Effect.provide(
            program,
            AgentsService.Default
          ),
          ToolbarsService.Default
        ),
        AppsService.Default
      )
    )
  })

  it('deletes an app', () => {
    const program = Effect.gen(function* () {
      // Get services
      const appsService = yield* AppsService
      const agentsService = yield* AgentsService
      const toolbarsService = yield* ToolbarsService
      
      // Create dependencies first
      const agent = { id: 'test-agent', initialAgentName: 'Test Agent' }
      yield* agentsService.create(agent)
      
      const toolbar = { id: 'test-toolbar', name: 'Test Toolbar', tools: [] }
      yield* toolbarsService.create(toolbar)
      
      // Create the app
      const app = {
        id: 'test-app',
        name: 'Test App',
        agentId: 'test-agent',
        toolbarId: 'test-toolbar'
      }
      yield* appsService.create(app)
      
      // Delete the app
      yield* appsService.delete('test-app')
      
      // Verify it's gone
      const retrieved = yield* appsService.getById('test-app')
      expect(retrieved._tag).toBe('None')
    })
    
    return Effect.runPromise(
      Effect.provide(
        Effect.provide(
          Effect.provide(
            program,
            AgentsService.Default
          ),
          ToolbarsService.Default
        ),
        AppsService.Default
      )
    )
  })

  it('lists all apps', () => {
    const program = Effect.gen(function* () {
      // Get services
      const appsService = yield* AppsService
      const agentsService = yield* AgentsService
      const toolbarsService = yield* ToolbarsService
      
      // Create dependencies first
      const agent = { id: 'test-agent', initialAgentName: 'Test Agent' }
      yield* agentsService.create(agent)
      
      const toolbar = { id: 'test-toolbar', name: 'Test Toolbar', tools: [] }
      yield* toolbarsService.create(toolbar)
      
      // Create multiple apps
      const app1 = {
        id: 'test-app-1',
        name: 'Test App 1',
        agentId: 'test-agent',
        toolbarId: 'test-toolbar'
      }
      const app2 = {
        id: 'test-app-2',
        name: 'Test App 2',
        agentId: 'test-agent',
        toolbarId: 'test-toolbar'
      }
      
      yield* appsService.create(app1)
      yield* appsService.create(app2)
      
      // List all apps and verify
      const apps = yield* appsService.getAll()
      expect(apps.length).toBe(2)
      expect(apps).toContainEqual(app1)
      expect(apps).toContainEqual(app2)
    })
    
    return Effect.runPromise(
      Effect.provide(
        Effect.provide(
          Effect.provide(
            program,
            AgentsService.Default
          ),
          ToolbarsService.Default
        ),
        AppsService.Default
      )
    )
  })
})
