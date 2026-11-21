
import { useEffect, useState } from 'react'
import { supabase } from '../lib/supabase'
import { useNavigate } from 'react-router-dom'

function Dashboard() {
  const navigate = useNavigate()

  const [user, setUser] = useState(null)
  const [tasks, setTasks] = useState([])
  const [title, setTitle] = useState('')
  const [description, setDescription] = useState('')
  const [dueDate, setDueDate] = useState('')
  const [priority, setPriority] = useState('Medium')
  const [status, setStatus] = useState('Pending')
  const [editingId, setEditingId] = useState(null)

  const [search, setSearch] = useState('')
  const [statusFilter, setStatusFilter] = useState('All')
  const [priorityFilter, setPriorityFilter] = useState('All')
  const [menuOpen, setMenuOpen] = useState(false)

  useEffect(() => {
    getUser()
  }, [])

  async function getUser() {
    const { data: { user } } = await supabase.auth.getUser()

    if (!user) {
      navigate('/login')
      return
    }

    setUser(user)
    fetchTasks(user.id)
  }

  async function fetchTasks(userId) {
    const { data, error } = await supabase
      .from('tasks')
      .select('*')
      .eq('user_id', userId)
      .order('created_at', { ascending: false })

    if (error) {
      alert(error.message)
      return
    }

    setTasks(data || [])
  }

  async function handleSubmit(e) {
    e.preventDefault()

    if (!title.trim()) {
      alert('Please enter a task title')
      return
    }

    const taskData = {
      title,
      description,
      due_date: dueDate || null,
      priority,
      status,
      user_id: user.id
    }

    let result

    if (editingId) {
      result = await supabase
        .from('tasks')
        .update(taskData)
        .eq('id', editingId)
        .eq('user_id', user.id)
    } else {
      result = await supabase
        .from('tasks')
        .insert([taskData])
    }

    if (result.error) {
      alert(result.error.message)
      return
    }

    resetForm()
    fetchTasks(user.id)
  }

  function resetForm() {
    setTitle('')
    setDescription('')
    setDueDate('')
    setPriority('Medium')
    setStatus('Pending')
    setEditingId(null)
  }

  function goToSection(sectionId) {
    setMenuOpen(false)

    document.getElementById(sectionId)?.scrollIntoView({
      behavior: 'smooth',
      block: 'start'
    })
  }

  function handleEdit(task) {
    setTitle(task.title)
    setDescription(task.description || '')
    setDueDate(task.due_date || '')
    setPriority(task.priority || 'Medium')
    setStatus(task.status || 'Pending')
    setEditingId(task.id)

    goToSection('task-form')
  }

  async function handleDelete(id) {
    if (!window.confirm('Are you sure you want to delete this task?')) {
      return
    }

    const { error } = await supabase
      .from('tasks')
      .delete()
      .eq('id', id)
      .eq('user_id', user.id)

    if (error) {
      alert(error.message)
      return
    }

    fetchTasks(user.id)
  }

  async function updateStatus(id, newStatus) {
    const { error } = await supabase
      .from('tasks')
      .update({ status: newStatus })
      .eq('id', id)
      .eq('user_id', user.id)

    if (error) {
      alert(error.message)
      return
    }

    fetchTasks(user.id)
  }

  async function handleLogout() {
    setMenuOpen(false)

    const { error } = await supabase.auth.signOut()

    if (error) {
      alert(error.message)
      return
    }

    navigate('/login')
  }

  // Task Analysis
  const totalTasks = tasks.length
  const pendingTasks = tasks.filter(t => t.status === 'Pending').length
  const progressTasks = tasks.filter(t => t.status === 'In Progress').length
  const completedTasks = tasks.filter(t => t.status === 'Completed').length

  const completionRate = totalTasks === 0
    ? 0
    : Math.round((completedTasks / totalTasks) * 100)

  const highPriorityTasks = tasks.filter(
    t => t.priority === 'High' && t.status !== 'Completed'
  ).length

  const today = new Date().toLocaleDateString('en-CA')

  const overdueTasks = tasks.filter(
    t => t.due_date && t.due_date < today && t.status !== 'Completed'
  ).length

  // Search, Status Filter and Priority Filter
  const filteredTasks = tasks
    .filter(task =>
      task.title.toLowerCase().includes(search.toLowerCase()) ||
      (task.description || '').toLowerCase().includes(search.toLowerCase())
    )
    .filter(task =>
      statusFilter === 'All' || task.status === statusFilter
    )
    .filter(task =>
      priorityFilter === 'All' || task.priority === priorityFilter
    )
    .sort((a, b) => {
      const order = { High: 1, Medium: 2, Low: 3 }
      return (order[a.priority] || 4) - (order[b.priority] || 4)
    })

  if (!user) {
    return <div className="loading">Loading dashboard...</div>
  }

  return (
    <div className="dashboard-page">

      {/* Floating Navigation Menu */}
      <div className="navigation-menu">
        <button
          className="menu-button"
          onClick={() => setMenuOpen(!menuOpen)}
          aria-label="Toggle navigation"
        >
          ☰
        </button>

        {menuOpen && (
          <div className="navigation-dropdown">
            <h3>Navigation</h3>

            <button onClick={() => goToSection('welcome')}>
              Welcome
            </button>

            <button onClick={() => goToSection('task-analysis')}>
              Task Analysis
            </button>

            <button onClick={() => goToSection('task-form')}>
              Add Task
            </button>

            <button onClick={() => goToSection('task-search')}>
              Search Tasks
            </button>

            <button onClick={() => goToSection('task-list')}>
              All Tasks
            </button>

            <button className="menu-logout" onClick={handleLogout}>
              Logout
            </button>
          </div>
        )}
      </div>

      {/* Header */}
      <header className="dashboard-header">
        <div className="brand-area">
          <div className="brand-icon">✓</div>
          <div>
            <h1>Task Manager</h1>
            <p>Organize your work. Achieve your goals.</p>
          </div>
        </div>
      </header>

      {/* Welcome */}
      <section id="welcome" className="welcome-section">
        <div>
          <span className="welcome-label">WELCOME BACK</span>
          <h2>Manage Your Tasks</h2>
          <p>Stay organized and keep track of your daily progress.</p>
        </div>

        <div className="user-pill">
          <div className="user-avatar">
            {(user.email || 'U').charAt(0).toUpperCase()}
          </div>
          <span>{user.email}</span>
        </div>
      </section>

      {/* Task Analysis */}
      <section id="task-analysis">
        <div className="section-heading">
          <span className="section-label">YOUR PERFORMANCE</span>
          <h2>Task Analysis</h2>
          <p>Get an overview of your task progress and priorities.</p>
        </div>

        <div className="stats-container">
          <div className="stat-card stat-total">
            <div className="stat-icon">📋</div>
            <h3>Total Tasks</h3>
            <p>{totalTasks}</p>
            <span>All your tasks</span>
          </div>

          <div className="stat-card stat-pending">
            <div className="stat-icon">⏳</div>
            <h3>Pending Tasks</h3>
            <p>{pendingTasks}</p>
            <span>Waiting to be started</span>
          </div>

          <div className="stat-card stat-progress">
            <div className="stat-icon">🔄</div>
            <h3>In Progress</h3>
            <p>{progressTasks}</p>
            <span>Currently working on</span>
          </div>

          <div className="stat-card stat-completed">
            <div className="stat-icon">✓</div>
            <h3>Completed Tasks</h3>
            <p>{completedTasks}</p>
            <span>Successfully completed</span>
          </div>
        </div>

        <div className="stats-container">
          <div className="stat-card stat-total">
            <div className="stat-icon">📈</div>
            <h3>Completion Rate</h3>
            <p>{completionRate}%</p>
            <span>Overall task completion</span>
          </div>

          <div className="stat-card stat-pending">
            <div className="stat-icon">🔥</div>
            <h3>High Priority</h3>
            <p>{highPriorityTasks}</p>
            <span>Uncompleted high priority tasks</span>
          </div>

          <div className="stat-card stat-progress">
            <div className="stat-icon">⚠️</div>
            <h3>Overdue Tasks</h3>
            <p>{overdueTasks}</p>
            <span>Tasks past their due date</span>
          </div>
        </div>
      </section>

      {/* Add Task */}
      <section id="task-form" className="task-form-section">
        <div className="section-heading">
          <span className="section-label">GET STARTED</span>
          <h2>{editingId ? 'Edit Task' : 'Add New Task'}</h2>
          <p>Create and manage your tasks easily.</p>
        </div>

        <form className="task-form" onSubmit={handleSubmit}>
          <div className="form-group">
            <label>Task Title</label>
            <input
              type="text"
              placeholder="Enter task title"
              value={title}
              onChange={e => setTitle(e.target.value)}
              required
            />
          </div>

          <div className="form-group">
            <label>Description</label>
            <textarea
              placeholder="Enter task description"
              value={description}
              onChange={e => setDescription(e.target.value)}
            />
          </div>

          <div className="form-row">
            <div className="form-group">
              <label>Due Date</label>
              <input
                type="date"
                value={dueDate}
                onChange={e => setDueDate(e.target.value)}
              />
            </div>

            <div className="form-group">
              <label>Priority</label>
              <select
                value={priority}
                onChange={e => setPriority(e.target.value)}
              >
                <option value="High">High</option>
                <option value="Medium">Medium</option>
                <option value="Low">Low</option>
              </select>
            </div>
          </div>

          {editingId && (
            <div className="form-group">
              <label>Status</label>
              <select
                value={status}
                onChange={e => setStatus(e.target.value)}
              >
                <option value="Pending">Pending</option>
                <option value="In Progress">In Progress</option>
                <option value="Completed">Completed</option>
              </select>
            </div>
          )}

          <div className="form-buttons">
            <button type="submit" className="add-btn">
              {editingId ? 'Update Task' : 'Add Task'}
            </button>

            {editingId && (
              <button
                type="button"
                className="cancel-btn"
                onClick={resetForm}
              >
                Cancel
              </button>
            )}
          </div>
        </form>
      </section>

      {/* Search and Filters */}
      <section id="task-search" className="task-form-section">
        <div className="section-heading">
          <span className="section-label">FIND YOUR WORK</span>
          <h2>Search Tasks</h2>
          <p>Search and filter your tasks easily.</p>
        </div>

        <div className="filter-section">
          <div className="search-box">
            <span>⌕</span>
            <input
              type="text"
              placeholder="Search by task title or description..."
              value={search}
              onChange={e => setSearch(e.target.value)}
            />
          </div>

          <select
            className="filter-select"
            value={statusFilter}
            onChange={e => setStatusFilter(e.target.value)}
          >
            <option value="All">All Status</option>
            <option value="Pending">Pending</option>
            <option value="In Progress">In Progress</option>
            <option value="Completed">Completed</option>
          </select>

          <select
            className="filter-select"
            value={priorityFilter}
            onChange={e => setPriorityFilter(e.target.value)}
          >
            <option value="All">All Priority</option>
            <option value="High">High</option>
            <option value="Medium">Medium</option>
            <option value="Low">Low</option>
          </select>
        </div>
      </section>

      {/* All Tasks */}
      <section id="task-list" className="task-list-section">
        <div className="task-list-heading">
          <span className="section-label">YOUR WORKSPACE</span>
          <h2>
            All Tasks <span className="task-count">{filteredTasks.length}</span>
          </h2>
          <p>View, update and manage all your tasks.</p>
        </div>

        {filteredTasks.length === 0 ? (
          <div className="empty-message">
            <div className="empty-icon">📋</div>
            <h3>No Tasks Found</h3>
            <p>
              {search || statusFilter !== 'All' || priorityFilter !== 'All'
                ? 'Try changing your search or filters.'
                : 'Add your first task to get started.'}
            </p>
          </div>
        ) : (
          <div className="task-grid">
            {filteredTasks.map(task => (
              <div
                className={`task-card ${task.status === 'Completed' ? 'completed-card' : ''}`}
                key={task.id}
              >
                <div className="task-card-top">
                  <span className="task-id">
                    TASK #{String(task.id).slice(0, 6)}
                  </span>

                  <span className={`status ${
                    task.status === 'Completed'
                      ? 'completed'
                      : task.status === 'In Progress'
                      ? 'in-progress'
                      : 'pending'
                  }`}>
                    {task.status}
                  </span>
                </div>

                <h3>{task.title}</h3>

                <p className="task-description">
                  {task.description || 'No description provided.'}
                </p>

                <div className="task-date">
                  📅 Due Date: {task.due_date || 'Not set'}
                </div>

                <div className="task-date">
                  🎯 Priority: <strong>{task.priority}</strong>
                </div>

              

                <div className="task-actions">
                  <button
                    className="edit-btn"
                    onClick={() => handleEdit(task)}
                  >
                    Edit
                  </button>

                  <button
                    className="delete-btn"
                    onClick={() => handleDelete(task.id)}
                  >
                    Delete
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </section>

      {/* Footer */}
      <footer className="dashboard-footer">
        <p>Task Manager</p>
        <p>Stay focused. Stay productive.</p>
      </footer>

    </div>
  )
}

export default Dashboard
