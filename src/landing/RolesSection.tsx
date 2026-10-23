
import { useId, useRef, useState } from 'react';
import type { KeyboardEvent } from 'react';
import { useMediaQuery } from '../hooks/browserHooks';
import { ROLES } from './content';
import { SectionHeader, StatusChip } from './ui';

export function RolesSection() {
  const [selected, setSelected] = useState(0);
  const baseId = useId();
  const tabRefs = useRef<Array<HTMLButtonElement | null>>([]);
  const horizontal = useMediaQuery('(max-width: 860px)');
  const role = ROLES[selected] ?? ROLES[0];

  const onKeyDown = (event: KeyboardEvent<HTMLDivElement>) => {
    const count = ROLES.length;
    let next: number;

    switch (event.key) {
      case 'ArrowDown':
      case 'ArrowRight':
        next = (selected + 1) % count;
        break;
      case 'ArrowUp':
      case 'ArrowLeft':
        next = (selected - 1 + count) % count;
        break;
      case 'Home':
        next = 0;
        break;
      case 'End':
        next = count - 1;
        break;
      default:
        return;
    }

    event.preventDefault();
    setSelected(next);
    tabRefs.current[next]?.focus();
  };

  if (!role) return null;

  return (
    <section id="roles" className="bs-section" aria-labelledby="roles-title">
      <div className="bs-container">
        <SectionHeader
          index="02"
          label="ROLES"
          titleId="roles-title"
          title="Four roles, one platform."
          intro="Select a role to see what it is designed to do."
        />

        <div className="bs-roles">
          <div className="bs-roles__side">
            <div
              className="bs-tablist"
              role="tablist"
              aria-label="Platform roles"
              aria-orientation={horizontal ? 'horizontal' : 'vertical'}
              onKeyDown={onKeyDown}
            >
              {ROLES.map((item, index) => (
                <button
                  key={item.id}
                  ref={(el) => {
                    tabRefs.current[index] = el;
                  }}
                  id={`${baseId}-tab-${item.id}`}
                  type="button"
                  role="tab"
                  className="bs-tab"
                  aria-selected={index === selected}
                  aria-controls={`${baseId}-panel`}
                  tabIndex={index === selected ? 0 : -1}
                  onClick={() => setSelected(index)}
                >
                  <span className="bs-tab__index">
                    {String(index + 1).padStart(2, '0')}
                  </span>
                  <span className="bs-tab__label">{item.label}</span>
                </button>
              ))}
            </div>

            <div className="bs-card bs-access">
              <p className="bs-label">ROLE ACCESS</p>
              <p className="bs-body-sm-text">
                Accounts are designed to start as Tourist. An administrator assigns the other roles.
              </p>
              <StatusChip status="IN PROGRESS" />
            </div>
          </div>

          <div
            id={`${baseId}-panel`}
            role="tabpanel"
            tabIndex={0}
            aria-labelledby={`${baseId}-tab-${role.id}`}
            className="bs-card bs-rolepanel"
          >
            <p className="bs-label bs-muted">{role.label.toUpperCase()}</p>
            <h3 className="bs-h-md">{role.title}</h3>
            <p className="bs-body-md bs-muted">{role.summary}</p>
            <ul className="bs-checklist bs-list-reset">
              {role.items.map((item) => (
                <li key={item} className="bs-body-md">
                  {item}
                </li>
              ))}
            </ul>
            {role.note ? (
              <p className="bs-body-sm-text bs-note">{role.note}</p>
            ) : null}
            <div className="bs-rolepanel__foot">
              <StatusChip status={role.status} />
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
