import { Show, SignInButton, SignUpButton, UserButton } from '@clerk/react';
import { LogoMark } from '../components/ui/icons';
import { ThemeSelector } from '../components/ui/ThemeSelector';

export function TouristTopBar() {
  return (
    <header className="vs-topbar">
      <div className="vs-wrap vs-topbar__in">
        <div className="vs-topbar__left">
          <a className="vs-brand" href="/" aria-label="Beach Safety, home page">
            <LogoMark />
            <span className="vs-brand__text">
              <span className="vs-brand__name">Beach Safety</span>
              <span className="vs-brand__sub">Andhra Pradesh</span>
            </span>
          </a>
          <span className="vs-tag">Prototype</span>
          <a className="vs-link" href="/">
            Home
          </a>
          <a className="vs-link" href="/dashboard">
            Authority dashboard
          </a>
        </div>

        <div className="vs-topbar__right">
          <ThemeSelector />
          <div className="vs-auth" role="group" aria-label="Account">
            <Show when="signed-out">
              <SignInButton>
                <button type="button" className="vs-btn vs-btn--primary">
                  Sign in
                </button>
              </SignInButton>
              <SignUpButton>
                <button type="button" className="vs-btn">
                  Sign up
                </button>
              </SignUpButton>
            </Show>
            <Show when="signed-in">
              <UserButton />
            </Show>
          </div>
        </div>
      </div>
    </header>
  );
}
