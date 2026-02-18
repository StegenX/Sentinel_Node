import { NavLink } from 'react-router-dom';

export default function Sidebar() {
    return (
        <aside className="sidebar">
            <div className="sidebar-brand">
                <div className="brand-icon">⬡</div>
                <div className="brand-text">
                    <span className="brand-name">SentinelNode</span>
                    <span className="brand-status">
                        <span className="status-dot online" />
                        Online
                    </span>
                </div>
            </div>

            <nav className="sidebar-nav">
                <NavLink to="/" end className={({ isActive }) => `nav-item ${isActive ? 'active' : ''}`}>
                    <span className="nav-icon">⊞</span>
                    Dashboard
                </NavLink>
                <NavLink to="/logs" className={({ isActive }) => `nav-item ${isActive ? 'active' : ''}`}>
                    <span className="nav-icon">≡</span>
                    Logs
                </NavLink>
            </nav>

            <button className="logout-btn">
                <span>⎋</span>
                Logout
            </button>
        </aside>
    );
}
