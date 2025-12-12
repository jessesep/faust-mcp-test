# Agent Activation Guide

## Current System Status

**Lana v3 Watchdog:** ✅ RUNNING (PID 24117)
- Monitoring manifest continuously
- Ready to assign tasks to agents
- Polling interval: 30 seconds

**Agent Terminal Windows:** ✅ VISIBLE (5 windows with color coding)
- All windows open with project environment variables set
- Ready to connect to task execution

**Task Queue:** ✅ READY
- 3 tasks in "assigned" status waiting for agents
- 10 tasks already completed
- Manifest in clean state

---

## What's Happening

The system is fully operational at the **infrastructure level**:
- Lana v3 runs continuously, monitoring the manifest
- 5 dedicated agent Terminal windows are visible with proper context
- Tasks are queued and ready for assignment

What's **missing** is agent execution code in those Terminal windows. Currently:
1. Lana detects when a task should be assigned
2. Lana writes the task to the manifest
3. The Terminal windows are empty - they don't read the manifest or execute work

---

## How to Activate Agents

### Option 1: Interactive Task Executor (Recommended for now)

Run this in each agent Terminal window:

```bash
cd /Users/jessesep/Projects/faust-mcp
node watchdog/agent-monitor.cjs
```

This will:
- Display current task assignments from Lana
- Show task details (title, description, deliverable)
- Offer to execute tasks interactively
- Mark tasks as complete in the manifest
- Continuously poll for new assignments

**To run in all 5 windows:**
1. Click in BUILDER-FAUST window → paste & run the command
2. Click in TESTER-FAUST window → paste & run the command
3. Repeat for THINKER-FAUST, UI-PRO-FAUST, BOOKKEEPER-FAUST

---

## Task Execution Flow

Once agents are activated with `agent-monitor.cjs`:

1. **Agent Reads Manifest**
   ```
   agent-monitor.cjs polls every 3 seconds
   Checks: Is there a task assigned to my role?
   ```

2. **Lana Assigns Work**
   ```
   When agent is ready (status: idle)
   Lana assigns next task from the queue
   Task status changes: assigned → in_progress
   ```

3. **Agent Executes Task**
   ```
   Agent displays task details in Terminal
   Agent asks: "Start working? (Y/N)"
   You can provide work or delegate to Claude
   ```

4. **Agent Reports Completion**
   ```
   Agent marks task: in_progress → completed
   Updates manifest with completion timestamp
   Manifest ready for next task assignment
   ```

5. **Loop Continues**
   ```
   Agent returns to "idle" status
   Waits for Lana to assign next task
   ```

---

## Pending Tasks (Ready to Execute)

### Builder Agent (3 pending tasks)
- [ ] faust-mcp-architecture-001: Design MCP Architecture
- [ ] faust-compiler-integration-001: Integrate Faust Compiler
- [ ] faust-performance-analysis-tools-001: Performance Analysis Tools

### UI-Pro Agent (3 pending tasks)
- [ ] faust-code-examples-library-001: Build Code Examples Library (30+ examples)
- [ ] faust-best-practices-guide-001: Document Best Practices
- [ ] faust-performance-analysis-tools-001: Performance Analysis Tools

### Tester Agent (0 pending)
No assignments currently. Will receive tasks when dependencies complete.

### Thinker Agent (0 pending)
No assignments currently. Will receive tasks when dependencies complete.

### Bookkeeper Agent (0 pending)
No assignments currently. Will receive tasks when dependencies complete.

---

## System Architecture (For Reference)

```
┌─────────────────────────────────────────┐
│       Lana v3 Watchdog                  │
│   (Monitors & Orchestrates)             │
│   PID: 24117                            │
│   Running continuously                  │
└──────────────┬──────────────────────────┘
               │
               │ reads/writes
               ↓
┌──────────────────────────────────────────────┐
│   Faust-MCP Manifest (manifest.json)         │
│   - Agent assignments                        │
│   - Task status tracking                     │
│   - Completion timestamps                    │
└──────────────┬───────────────────────────────┘
               │
               │ observes & updates
               ↓
┌─────────────────────────────────────────────────────────────┐
│          Agent Terminal Windows (5 visible)                 │
│                                                             │
│  ┌────────────────────┐  ┌────────────────────┐           │
│  │  BUILDER-FAUST    │  │  TESTER-FAUST     │           │
│  │  (Red background) │  │  (Green background)│           │
│  │  Runs:            │  │  Runs:             │           │
│  │  agent-monitor.cjs│  │  agent-monitor.cjs │           │
│  └────────────────────┘  └────────────────────┘           │
│                                                             │
│  ┌────────────────────┐  ┌────────────────────┐           │
│  │ THINKER-FAUST     │  │  UI-PRO-FAUST     │           │
│  │ (Blue background) │  │ (Purple background)│           │
│  │ Runs:             │  │ Runs:              │           │
│  │ agent-monitor.cjs │  │ agent-monitor.cjs  │           │
│  └────────────────────┘  └────────────────────┘           │
│                                                             │
│  ┌────────────────────────────────────────┐               │
│  │   BOOKKEEPER-FAUST (Gray background)   │               │
│  │   Runs: agent-monitor.cjs              │               │
│  └────────────────────────────────────────┘               │
│                                                             │
│  Agent Monitor Flow:                                       │
│  1. Reads manifest (every 3 sec)                           │
│  2. Displays assigned task details                         │
│  3. Waits for user (Y/N to start)                          │
│  4. User provides work/output                              │
│  5. Agent marks task complete                              │
│  6. Loop back to step 1                                    │
└─────────────────────────────────────────────────────────────┘
```

---

## Next Steps (After Activation)

### Phase 1: Verify System Works
1. Activate agents in 2 terminal windows first (builder + ui-pro)
2. Observe task assignments happen automatically
3. Confirm manifest updates with task completion

### Phase 2: Full Execution
1. Activate all 5 agents
2. System manages full task workflow
3. Monitor progress from Lana window

### Phase 3: Real Agent Autonomy (Future)
Once system proves stable, can upgrade from interactive to full automation:
- Agents spawn Claude for actual task execution
- No manual confirmation needed
- Full autonomous workflow

---

## Troubleshooting

**Issue:** "Cannot load manifest"
- Check: Is /Users/jessesep/.claude/projects/faust-mcp/manifest.json readable?
- Fix: Verify file permissions and path

**Issue:** "No task assigned"
- Check: Is Lana running? (should see in Lana window)
- Check: Are there queued tasks? (check manifest)
- Fix: Lana assigns tasks on 30-second cycle; may need to wait

**Issue:** "Agent shows 'idle' forever"
- Check: Did you run agent-monitor.cjs in that window?
- Check: Is the Terminal process still active?
- Fix: Restart agent-monitor.cjs in that window

**Issue:** "Task status not updating in manifest"
- Check: Can agent-monitor.cjs write to manifest? (file permissions)
- Check: Is manifest locked by Lana? (try again in 5 seconds)
- Fix: Verify file ownership: `ls -la manifest.json`

---

## Configuration Files

If needed to debug or reconfigure:

- **Manifest:** `/Users/jessesep/.claude/projects/faust-mcp/manifest.json`
- **Lana Script:** `/Users/jessesep/Projects/faust-mcp/watchdog/lana-v3.cjs`
- **Agent Monitor:** `/Users/jessesep/Projects/faust-mcp/watchdog/agent-monitor.cjs`
- **Agent Specs:** `/Users/jessesep/Projects/faust-mcp/.planning/AGENT-SPECS/`

---

## Summary

**System Status:** 🟢 Ready for Agent Activation

The infrastructure is complete. To start execution:

1. Click into each Terminal window
2. Run: `node watchdog/agent-monitor.cjs`
3. Agent will connect to Lana and begin monitoring for tasks
4. Respond to task prompts to execute work
5. Watch manifest update as tasks complete

The system is now ready to demonstrate autonomous multi-agent orchestration with full visibility into the workflow.
