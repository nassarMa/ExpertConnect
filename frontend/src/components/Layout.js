import React from 'react';
import Link from 'next/link';
import { useRouter } from 'next/router';
import { useAuth } from '../context/AuthContext';
import { useCreditContext } from '../context/CreditContext';
import { useMessagingContext } from '../context/MessagingContext';
import styles from '../styles/Layout.module.css';

const Layout = ({ children }) => {
  const router = useRouter();
  const { user, logout } = useAuth();
  const { balance } = useCreditContext();
  
  return (
    <div className={styles.container}>
      <header className={styles.header}>
        <div className={styles.logo}>
          <Link href="/">
            <a>ExpertConnect</a>
          </Link>
        </div>
        <nav className={styles.nav}>
          {user ? (
            <>
              <Link href="/dashboard">
                <a className={router.pathname === '/dashboard' ? styles.active : ''}>Dashboard</a>
              </Link>
              <Link href="/experts">
                <a className={router.pathname.startsWith('/experts') ? styles.active : ''}>Experts</a>
              </Link>
              <Link href="/meetings">
                <a className={router.pathname.startsWith('/meetings') ? styles.active : ''}>Meetings</a>
              </Link>
              <Link href="/messages">
                <a className={router.pathname.startsWith('/messages') ? styles.active : ''}>Messages</a>
              </Link>
              <Link href="/credits">
                <a className={router.pathname.startsWith('/credits') ? styles.active : ''}>
                  Credits: {balance}
                </a>
              </Link>
              <Link href="/profile">
                <a className={router.pathname === '/profile' ? styles.active : ''}>Profile</a>
              </Link>
              <button onClick={logout} className={styles.logoutBtn}>Logout</button>
            </>
          ) : (
            <Link href="/login">
              <a className={styles.loginBtn}>Login</a>
            </Link>
          )}
        </nav>
      </header>
      <main className={styles.main}>{children}</main>
      <footer className={styles.footer}>
        <p>&copy; {new Date().getFullYear()} ExpertConnect. All rights reserved.</p>
      </footer>
    </div>
  );
};

export default Layout;
