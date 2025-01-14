import '@testing-library/jest-dom';
import React from 'react';
import TestRenderer from 'react-test-renderer';
import { FormattedMessage } from 'react-intl';
import { MemoryRouter } from 'react-router-dom';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';

import {
  LockedTaskModalContent,
  SameProjectLock,
  AnotherProjectLock,
  LicenseError,
  LockError,
} from '../lockedTasks';
import {
  createComponentWithMemoryRouter,
  createComponentWithReduxAndIntl,
  IntlProviders,
  ReduxIntlProviders,
  renderWithRouter,
} from '../../../utils/testWithIntl';
import { store } from '../../../store';
import messages from '../messages';

jest.mock('react-router-dom', () => ({
  ...jest.requireActual('react-router-dom'),
  useLocation: () => ({
    pathname: 'localhost:3000/example/path',
  }),
}));

describe('test LockedTaskModalContent', () => {
  const { act } = TestRenderer;
  it('return SameProjectLock message', () => {
    act(() => {
      store.dispatch({ type: 'SET_PROJECT', project: 1 });
      store.dispatch({ type: 'SET_LOCKED_TASKS', tasks: [21] });
      store.dispatch({ type: 'SET_TASKS_STATUS', status: 'LOCKED_FOR_MAPPING' });
    });
    const instance = createComponentWithReduxAndIntl(
      <MemoryRouter>
        <LockedTaskModalContent project={{ projectId: 1 }} error={null} />
      </MemoryRouter>,
    );
    const element = instance.root;
    expect(element.findByType(SameProjectLock)).toBeTruthy();
  });

  it('return SameProjectLock message', () => {
    act(() => {
      store.dispatch({ type: 'SET_PROJECT', project: 2 });
      store.dispatch({ type: 'SET_LOCKED_TASKS', tasks: [21] });
      store.dispatch({ type: 'SET_TASKS_STATUS', status: 'LOCKED_FOR_MAPPING' });
    });
    const instance = createComponentWithReduxAndIntl(
      <MemoryRouter>
        <LockedTaskModalContent project={{ projectId: 1 }} error={null} />
      </MemoryRouter>,
    );
    const element = instance.root;
    expect(element.findByType(AnotherProjectLock)).toBeTruthy();
  });

  it('return LicenseError message', () => {
    act(() => {
      store.dispatch({ type: 'SET_PROJECT', project: null });
      store.dispatch({ type: 'SET_LOCKED_TASKS', tasks: [] });
      store.dispatch({ type: 'SET_TASKS_STATUS', status: null });
    });
    const instance = createComponentWithReduxAndIntl(
      <LockedTaskModalContent
        project={{ projectId: 1, licenseId: 123 }}
        error={'UserLicenseError'}
      />,
    );
    const element = instance.root;
    expect(element.findByType(LicenseError)).toBeTruthy();
  });

  it('return JosmError message', () => {
    act(() => {
      store.dispatch({ type: 'SET_PROJECT', project: null });
      store.dispatch({ type: 'SET_LOCKED_TASKS', tasks: [] });
      store.dispatch({ type: 'SET_TASKS_STATUS', status: null });
    });
    const instance = createComponentWithReduxAndIntl(
      <LockedTaskModalContent project={{ projectId: 1, licenseId: 123 }} error={'JOSM'} />,
    );
    const element = instance.root;
    expect(element.findByType(LockError)).toBeTruthy();
    expect(element.findAllByType(FormattedMessage).length).toBe(3);
  });

  it('return forbidden to map the task message', () => {
    act(() => {
      store.dispatch({ type: 'SET_PROJECT', project: null });
      store.dispatch({ type: 'SET_LOCKED_TASKS', tasks: [] });
      store.dispatch({ type: 'SET_TASKS_STATUS', status: null });
    });
    const instance = createComponentWithReduxAndIntl(
      <LockedTaskModalContent project={{ projectId: 1, licenseId: 123 }} error={'FORBIDDEN'} />,
    );
    const element = instance.root;
    expect(element.findByType(LockError)).toBeTruthy();
  });

  it('return no map tasks selected message', () => {
    act(() => {
      store.dispatch({ type: 'SET_PROJECT', project: null });
      store.dispatch({ type: 'SET_LOCKED_TASKS', tasks: [] });
      store.dispatch({ type: 'SET_TASKS_STATUS', status: null });
    });
    const instance = createComponentWithReduxAndIntl(
      <LockedTaskModalContent
        project={{ projectId: 1, licenseId: 123 }}
        error={'noMappedTasksSelected'}
      />,
    );
    const element = instance.root;
    expect(element.findByType(LockError)).toBeTruthy();
  });

  it('return LockError message', () => {
    act(() => {
      store.dispatch({ type: 'SET_PROJECT', project: null });
      store.dispatch({ type: 'SET_LOCKED_TASKS', tasks: [] });
      store.dispatch({ type: 'SET_TASKS_STATUS', status: null });
    });
    const instance = createComponentWithReduxAndIntl(
      <LockedTaskModalContent project={{ projectId: 1, licenseId: 123 }} error={'BAD REQUEST'} />,
    );
    const element = instance.root;
    expect(element.findByType(LockError)).toBeTruthy();
  });
});

describe('License Modal', () => {
  it('should accept the license', async () => {
    const lockTasksMock = jest.fn();
    render(
      <ReduxIntlProviders>
        <LicenseError id="456" lockTasks={lockTasksMock} />
      </ReduxIntlProviders>,
    );
    await screen.findByText('Sample License');
    await userEvent.click(
      screen.getByRole('button', {
        name: /accept/i,
      }),
    );
    await waitFor(() => expect(lockTasksMock).toHaveBeenCalled());
  });

  it('should decline request to accept the license', async () => {
    const closeMock = jest.fn();
    render(
      <ReduxIntlProviders>
        <LicenseError id="456" close={closeMock} />
      </ReduxIntlProviders>,
    );
    await screen.findByText('Sample License');
    await userEvent.click(
      screen.getByRole('button', {
        name: /cancel/i,
      }),
    );
    expect(closeMock).toHaveBeenCalled();
  });
});

test('SameProjectLock should display relevant message when user has multiple tasks locked', async () => {
  const lockedTasksSample = {
    project: 5871,
    tasks: [1811, 1222],
    status: 'LOCKED_FOR_VALIDATION',
  };
  const { router } = createComponentWithMemoryRouter(
    <IntlProviders>
      <SameProjectLock lockedTasks={lockedTasksSample} action="validate" />
    </IntlProviders>,
  );
  expect(
    screen.getByText(messages.currentProjectLockTextPlural.defaultMessage),
  ).toBeInTheDocument();
  await userEvent.click(
    screen.getByRole('button', {
      name: 'Validate those tasks',
    }),
  );
  await waitFor(() => expect(router.state.location.pathname).toBe('/projects/5871/validate/'));
});

test('AnotherProjectLock should display relevant message when user has multiple tasks locked', async () => {
  renderWithRouter(
    <IntlProviders>
      <AnotherProjectLock projectId={1234} lockedTasksLength={2} action="validate" />
    </IntlProviders>,
  );
  expect(
    screen.getByText(
      /You will need to update the status of that task before you can map another task./i,
    ),
  ).toBeInTheDocument();
});
