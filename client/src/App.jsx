import { useEffect, useState } from 'react';
import { Link, NavLink, Outlet, Route, Routes, useLocation, useNavigate, useParams } from 'react-router-dom';
import {
  ArrowDownLeft, ArrowLeft, ArrowRight, BriefcaseBusiness, Building2, CalendarDays,
  Check, ChevronDown, CircleHelp, ClipboardList, Clock3, LayoutDashboard, Mail,
  MapPin, MoreHorizontal, Pencil, Plus, Search, Settings2, ShieldCheck, Trash2,
  UserRound, Users, Wallet
} from 'lucide-react';

const api = async (path, options = {}) => {
  const response = await fetch(`/api${path}`, {
    ...options,
    headers: { 'Content-Type': 'application/json', ...options.headers }
  });
  if (!response.ok) {
    const body = await response.json().catch(() => ({}));
    throw new Error(body.message || 'Unable to complete your request.');
  }
  return response.status === 204 ? null : response.json();
};

const money = (value) => new Intl.NumberFormat('en-US', {
  style: 'currency', currency: 'USD', maximumFractionDigits: 0
}).format(Number(value || 0));

const dateLabel = (value) => value
  ? new Intl.DateTimeFormat('en-US', { month: 'short', day: 'numeric', year: 'numeric' }).format(new Date(value))
  : 'Not set';

const employeeName = (employee) => `${employee.firstName} ${employee.lastName}`;

function Avatar({ employee, large = false }) {
  const initials = `${employee.firstName?.[0] || ''}${employee.lastName?.[0] || ''}`.toUpperCase();
  return <span className={`avatar ${large ? 'avatar-large' : ''}`}>{initials || '??'}</span>;
}

function Status({ status }) {
  return <span className={`status status-${status?.toLowerCase().replaceAll(' ', '-')}`}>{status}</span>;
}

function Shell() {
  const location = useLocation();
  const title = location.pathname === '/' ? 'Overview'
    : location.pathname === '/employees/new' ? 'Add employee'
      : location.pathname.endsWith('/edit') ? 'Edit employee'
        : location.pathname.startsWith('/employees/') ? 'Employee profile' : 'All employees';
  const routeMatch = location.pathname.match(/^\/employees\/([^/]+)(?:\/edit)?$/);
  const employeeId = routeMatch?.[1] && routeMatch[1] !== 'new' ? routeMatch[1] : null;
  const employeeTabs = [
    { label: 'Employee list', to: '/employees', Icon: Users, end: true },
    { label: 'Registration', to: '/employees/new', Icon: Plus },
    { label: 'Details', to: employeeId ? `/employees/${employeeId}` : null, Icon: UserRound, end: true },
    { label: 'Edit employee', to: employeeId ? `/employees/${employeeId}/edit` : null, Icon: Pencil }
  ];

  return (
    <div className="app-shell">
      <aside className="sidebar">
        <Link className="brand" to="/" aria-label="People home">
          <span className="brand-mark"><Users size={19} strokeWidth={2.3} /></span>
          <span className="brand-copy"><strong>people</strong><small>TEAM DIRECTORY</small></span>
        </Link>
        <div className="workspace-label">WORKSPACE <ChevronDown size={13} /></div>
        <nav className="primary-nav" aria-label="Main navigation">
          <NavLink to="/" end><LayoutDashboard size={17} />Overview</NavLink>
          <NavLink to="/employees"><Users size={17} />Employees</NavLink>
          <NavLink to="/employees/new"><Plus size={17} />Add employee</NavLink>
        </nav>
        <div className="sidebar-bottom">
          <NavLink to="/employees"><Settings2 size={17} />Directory settings</NavLink>
          <NavLink to="/employees"><CircleHelp size={17} />Help & support</NavLink>
          <div className="account-card">
            <span className="account-avatar">JD</span>
            <span className="account-copy"><strong>Jordan Davis</strong><small>People operations</small></span>
            <MoreHorizontal size={17} />
          </div>
        </div>
      </aside>
      <main className="main-panel">
        <header className="topbar">
          <div className="breadcrumb"><span>Workspace</span><span className="crumb-slash">/</span><strong>{title}</strong></div>
          <div className="topbar-actions"><span className="today-label"><CalendarDays size={15} />{dateLabel(new Date())}</span><button className="icon-button" aria-label="Help"><CircleHelp size={18} /></button><span className="topbar-avatar">JD</span></div>
        </header>
        {location.pathname.startsWith('/employees') && <nav className="employee-tabs" aria-label="Employee pages">
          {employeeTabs.map(({ label, to, Icon, end }) => to
            ? <NavLink key={label} to={to} end={end} className={({ isActive }) => `employee-tab${isActive ? ' active' : ''}`}><Icon size={15} />{label}</NavLink>
            : <span key={label} className="employee-tab employee-tab-disabled" aria-disabled="true" title="Select an employee to open this page"><Icon size={15} />{label}</span>)}
        </nav>}
        <div className="page-content"><Outlet /></div>
      </main>
    </div>
  );
}

function PageHeading({ eyebrow, title, description, action }) {
  return <div className="page-heading"><div><p className="eyebrow">{eyebrow}</p><h1>{title}</h1>{description && <p className="page-description">{description}</p>}</div>{action}</div>;
}

function Loading({ label = 'Loading employees' }) {
  return <div className="feedback"><span className="spinner" />{label}...</div>;
}

function ErrorMessage({ message }) {
  return <div className="feedback feedback-error"><ShieldCheck size={18} /><span>{message} Make sure the API and MongoDB are running.</span></div>;
}

function EmptyState({ search = false }) {
  return <div className="empty-state"><span className="empty-icon"><Users size={22} /></span><h3>{search ? 'No matching employees' : 'Your directory is ready'}</h3><p>{search ? 'Try another name, role, or filter.' : 'Register your first employee to start building the team directory.'}</p>{!search && <Link to="/employees/new" className="button button-primary"><Plus size={16} />Add employee</Link>}</div>;
}

function EmployeeRows({ employees }) {
  return <div className="table-scroll"><table><thead><tr><th>EMPLOYEE</th><th>ROLE</th><th>DEPARTMENT</th><th>STATUS</th><th>START DATE</th><th><span className="sr-only">Actions</span></th></tr></thead><tbody>
    {employees.map((employee) => <tr key={employee._id}>
      <td><Link className="employee-cell" to={`/employees/${employee._id}`}><Avatar employee={employee} /><span><strong>{employeeName(employee)}</strong><small>{employee.email}</small></span></Link></td>
      <td>{employee.role}</td><td>{employee.department}</td><td><Status status={employee.status} /></td><td>{dateLabel(employee.startDate)}</td>
      <td><Link className="row-action" to={`/employees/${employee._id}`} aria-label={`View ${employeeName(employee)}`}><ArrowRight size={16} /></Link></td>
    </tr>)}
  </tbody></table></div>;
}

function Dashboard() {
  const [employees, setEmployees] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  useEffect(() => {
    const controller = new AbortController();
    api('/employees', { signal: controller.signal }).then(setEmployees).catch((err) => {
      if (err.name !== 'AbortError') setError(err.message);
    }).finally(() => setLoading(false));
    return () => controller.abort();
  }, []);
  const active = employees.filter((employee) => employee.status === 'Active').length;
  const departments = new Set(employees.map((employee) => employee.department)).size;
  const recent = [...employees].sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt)).slice(0, 5);

  return <>
    <PageHeading eyebrow="PEOPLE OVERVIEW" title="Good morning, Jordan" description="A clear view of your people, all in one place." action={<Link className="button button-primary" to="/employees/new"><Plus size={16} />Add employee</Link>} />
    {error ? <ErrorMessage message={error} /> : loading ? <Loading /> : <>
      <section className="stats-grid" aria-label="Employee summary">
        <article className="stat-card stat-green"><div className="stat-top"><span>Total employees</span><Users size={17} /></div><div className="stat-value">{employees.length.toString().padStart(2, '0')}</div><div className="stat-note"><span className="note-dot" />Across your organization</div></article>
        <article className="stat-card"><div className="stat-top"><span>Active employees</span><ShieldCheck size={17} /></div><div className="stat-value">{active.toString().padStart(2, '0')}</div><div className="stat-note"><span className="status-dot" />Currently working</div></article>
        <article className="stat-card"><div className="stat-top"><span>Departments</span><Building2 size={17} /></div><div className="stat-value">{departments.toString().padStart(2, '0')}</div><div className="stat-note">Represented in directory</div></article>
        <article className="stat-card stat-accent"><div className="stat-top"><span>On leave</span><Clock3 size={17} /></div><div className="stat-value">{employees.filter((employee) => employee.status === 'On leave').length.toString().padStart(2, '0')}</div><div className="stat-note">Out of office today</div></article>
      </section>
      <section className="content-section">
        <div className="section-heading"><div><p className="eyebrow">YOUR TEAM</p><h2>Recently added</h2></div><Link className="text-link" to="/employees">View directory <ArrowRight size={15} /></Link></div>
        <div className="table-panel">{recent.length ? <EmployeeRows employees={recent} /> : <EmptyState />}</div>
      </section>
      <section className="bottom-banner"><span className="banner-icon"><ClipboardList size={20} /></span><div><strong>Keep your directory up to date</strong><p>Add new team members or update employee details from one place.</p></div><Link to="/employees" className="button button-outline">Open directory <ArrowRight size={15} /></Link></section>
    </>}
  </>;
}

function EmployeeList() {
  const [employees, setEmployees] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [search, setSearch] = useState('');
  const [department, setDepartment] = useState('');
  const [status, setStatus] = useState('');
  const query = new URLSearchParams({ ...(search && { q: search }), ...(department && { department }), ...(status && { status }) }).toString();
  useEffect(() => {
    const controller = new AbortController();
    setLoading(true);
    setError('');
    api(`/employees${query ? `?${query}` : ''}`, { signal: controller.signal }).then(setEmployees).catch((err) => {
      if (err.name !== 'AbortError') setError(err.message);
    }).finally(() => { if (!controller.signal.aborted) setLoading(false); });
    return () => controller.abort();
  }, [query]);
  const departments = [...new Set(employees.map((employee) => employee.department))].sort();

  return <>
    <PageHeading eyebrow="TEAM DIRECTORY" title="Employees" description="Manage the people who make your organization work." action={<Link className="button button-primary" to="/employees/new"><Plus size={16} />Add employee</Link>} />
    <section className="directory-panel">
      <div className="directory-toolbar"><div className="search-box"><Search size={17} /><input aria-label="Search employees" placeholder="Search name, role, or email" value={search} onChange={(event) => setSearch(event.target.value)} /></div><div className="filters"><label className="select-wrap"><span className="sr-only">Filter by department</span><select value={department} onChange={(event) => setDepartment(event.target.value)}><option value="">All departments</option>{departments.map((item) => <option key={item}>{item}</option>)}</select><ChevronDown size={14} /></label><label className="select-wrap"><span className="sr-only">Filter by status</span><select value={status} onChange={(event) => setStatus(event.target.value)}><option value="">All statuses</option><option>Active</option><option>On leave</option><option>Inactive</option></select><ChevronDown size={14} /></label></div></div>
      <div className="table-meta"><span><strong>{employees.length}</strong> {employees.length === 1 ? 'employee' : 'employees'}</span><span>Updated just now</span></div>
      {error ? <ErrorMessage message={error} /> : loading ? <Loading /> : employees.length ? <EmployeeRows employees={employees} /> : <EmptyState search={Boolean(search || department || status)} />}
      <div className="table-footer"><span>Showing {employees.length} {employees.length === 1 ? 'result' : 'results'}</span><button className="pagination-button" disabled><ArrowLeft size={15} /> Previous</button><button className="pagination-button" disabled>Next <ArrowRight size={15} /></button></div>
    </section>
  </>;
}

function EmployeeForm() {
  const { id } = useParams();
  const editing = Boolean(id);
  const navigate = useNavigate();
  const [form, setForm] = useState({ firstName: '', lastName: '', email: '', phone: '', department: '', role: '', location: '', startDate: '', salary: '', status: 'Active' });
  const [loading, setLoading] = useState(editing);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  useEffect(() => {
    if (!editing) return;
    const controller = new AbortController();
    api(`/employees/${id}`, { signal: controller.signal }).then((employee) => setForm({
      firstName: employee.firstName, lastName: employee.lastName, email: employee.email,
      phone: employee.phone, department: employee.department, role: employee.role,
      location: employee.location, startDate: employee.startDate?.slice(0, 10),
      salary: employee.salary, status: employee.status
    })).catch((err) => { if (err.name !== 'AbortError') setError(err.message); }).finally(() => setLoading(false));
    return () => controller.abort();
  }, [editing, id]);
  const update = (event) => setForm({ ...form, [event.target.name]: event.target.value });
  const submit = async (event) => {
    event.preventDefault();
    setSaving(true);
    setError('');
    try {
      const employee = await api(`/employees${editing ? `/${id}` : ''}`, {
        method: editing ? 'PUT' : 'POST', body: JSON.stringify({ ...form, salary: Number(form.salary) })
      });
      navigate(`/employees/${employee._id}`);
    } catch (err) {
      setError(err.message);
    } finally {
      setSaving(false);
    }
  };
  const field = (name, label, type = 'text', placeholder = '', props = {}) => <label className="form-field" key={name}><span>{label}<b>*</b></span><input name={name} type={type} value={form[name]} onChange={update} placeholder={placeholder} required {...props} /></label>;

  if (loading) return <Loading label="Loading employee" />;
  return <>
    <Link className="back-link" to={editing ? `/employees/${id}` : '/employees'}><ArrowLeft size={16} />{editing ? 'Back to profile' : 'Back to employees'}</Link>
    <PageHeading eyebrow={editing ? 'EMPLOYEE PROFILE' : 'NEW TEAM MEMBER'} title={editing ? 'Edit employee' : 'Register an employee'} description={editing ? 'Update this employee’s information.' : 'Add a new person to your organization directory.'} />
    <form className="form-panel" onSubmit={submit}>
      <div className="form-section"><div className="form-section-heading"><span className="form-section-icon"><UserRound size={17} /></span><div><h2>Personal information</h2><p>Basic details used in the employee directory.</p></div></div><div className="form-grid">
        {field('firstName', 'First name', 'text', 'e.g. Alex')}{field('lastName', 'Last name', 'text', 'e.g. Morgan')}{field('email', 'Work email', 'email', 'alex@company.com')}{field('phone', 'Phone number', 'tel', '+1 (555) 000-0000')}
      </div></div>
      <div className="form-section"><div className="form-section-heading"><span className="form-section-icon form-icon-lime"><BriefcaseBusiness size={17} /></span><div><h2>Work details</h2><p>Role, team, and employment information.</p></div></div><div className="form-grid">
        {field('role', 'Job title', 'text', 'e.g. Product designer')}{field('department', 'Department', 'text', 'e.g. Design')}{field('location', 'Work location', 'text', 'e.g. New York, NY')}{field('startDate', 'Start date', 'date')}{field('salary', 'Annual salary', 'number', 'e.g. 85000', { min: '0', step: '1000' })}
        <label className="form-field"><span>Employment status<b>*</b></span><select name="status" value={form.status} onChange={update} required><option>Active</option><option>On leave</option><option>Inactive</option></select></label>
      </div></div>
      {error && <p className="form-error" role="alert">{error}</p>}
      <div className="form-actions"><span><b>*</b> Required fields</span><div><Link className="button button-quiet" to={editing ? `/employees/${id}` : '/employees'}>Cancel</Link><button className="button button-primary" type="submit" disabled={saving}>{saving ? 'Saving...' : <><Check size={16} />{editing ? 'Save changes' : 'Register employee'}</>}</button></div></div>
    </form>
  </>;
}

function EmployeeDetails() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [employee, setEmployee] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [deleting, setDeleting] = useState(false);
  useEffect(() => {
    const controller = new AbortController();
    api(`/employees/${id}`, { signal: controller.signal }).then(setEmployee).catch((err) => {
      if (err.name !== 'AbortError') setError(err.message);
    }).finally(() => setLoading(false));
    return () => controller.abort();
  }, [id]);
  const remove = async () => {
    if (!window.confirm(`Delete ${employeeName(employee)} from the directory? This cannot be undone.`)) return;
    setDeleting(true);
    try { await api(`/employees/${id}`, { method: 'DELETE' }); navigate('/employees'); }
    catch (err) { setError(err.message); setDeleting(false); }
  };

  if (loading) return <Loading label="Loading profile" />;
  if (error && !employee) return <><Link className="back-link" to="/employees"><ArrowLeft size={16} />Back to employees</Link><ErrorMessage message={error} /></>;
  return <>
    <Link className="back-link" to="/employees"><ArrowLeft size={16} />Back to employees</Link>
    {error && <p className="form-error" role="alert">{error}</p>}
    <div className="profile-heading"><div className="profile-person"><Avatar employee={employee} large /><div><p className="eyebrow">EMPLOYEE PROFILE</p><h1>{employeeName(employee)}</h1><p className="profile-role">{employee.role} <span>·</span> {employee.department}</p></div></div><div className="profile-actions"><Link className="button button-outline" to={`/employees/${id}/edit`}><Pencil size={15} />Edit employee</Link><button className="button button-danger" onClick={remove} disabled={deleting}><Trash2 size={15} />{deleting ? 'Deleting...' : 'Delete'}</button></div></div>
    <div className="profile-grid"><section className="profile-panel"><div className="section-heading"><div><p className="eyebrow">ABOUT</p><h2>Personal details</h2></div></div><dl className="detail-list"><div><dt><Mail size={16} />Work email</dt><dd><a href={`mailto:${employee.email}`}>{employee.email}</a></dd></div><div><dt><UserRound size={16} />Phone</dt><dd>{employee.phone}</dd></div><div><dt><MapPin size={16} />Location</dt><dd>{employee.location}</dd></div></dl></section>
      <section className="profile-panel"><div className="section-heading"><div><p className="eyebrow">ORGANIZATION</p><h2>Work information</h2></div></div><dl className="detail-list"><div><dt><BriefcaseBusiness size={16} />Job title</dt><dd>{employee.role}</dd></div><div><dt><Building2 size={16} />Department</dt><dd>{employee.department}</dd></div><div><dt><CalendarDays size={16} />Start date</dt><dd>{dateLabel(employee.startDate)}</dd></div><div><dt><Wallet size={16} />Annual salary</dt><dd>{money(employee.salary)}</dd></div><div><dt><ArrowDownLeft size={16} />Status</dt><dd><Status status={employee.status} /></dd></div></dl></section></div>
  </>;
}

export default function App() {
  return <Routes><Route element={<Shell />}><Route index element={<Dashboard />} /><Route path="employees" element={<EmployeeList />} /><Route path="employees/new" element={<EmployeeForm />} /><Route path="employees/:id" element={<EmployeeDetails />} /><Route path="employees/:id/edit" element={<EmployeeForm />} /><Route path="*" element={<EmployeeList />} /></Route></Routes>;
}
