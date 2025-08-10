module.exports = {
  branches: [
    'main',
    'next',
    'next-major',
    '+([0-9])?(.{+([0-9]),x}).x',
    {
      name: 'dev',
      prerelease: true,
    },
    {
      name: 'test',
      prerelease: true,
    },
    {
      name: 'test-*',
      prerelease: true,
    },
    {
      name: 'sit',
      prerelease: true,
    },
  ],
  preset: 'conventionalcommits',
  presetConfig: {
    types: [
      {
        type: 'feat',
        section: '🎉 Features',
      },
      {
        type: 'fix',
        section: '🐛 Bug Fixes',
      },
      {
        type: 'docs',
        section: '📝 Documentation',
        hidden: false,
      },
      {
        type: 'style',
        section: '🎨 Theme and UI',
        hidden: false,
      },
      {
        type: 'perf',
        section: '✨ Performance Improvements',
        hidden: false,
      },
      {
        type: 'test',
        section: '🧪 Unit Tests',
        hidden: false,
      },
      {
        type: 'refactor',
        section: '💡 Code Refactors',
        hidden: false,
      },
      {
        type: 'build',
        section: '📦️ Build System and Packaging',
        hidden: false,
      },
      {
        type: 'ci',
        section: '🧑‍💻 CI/CD Scripts',
        hidden: false,
      },
      {
        type: 'chore',
        section: '🔧 Miscellaneous Chores',
        hidden: false,
      },
    ],
  },
  releaseRules: [
    {
      breaking: true,
      release: 'major',
    },
    {
      type: 'feat',
      release: 'minor',
    },
    {
      type: 'fix',
      release: 'patch',
    },
    {
      type: 'docs',
      release: 'patch',
    },
    {
      type: 'style',
      release: 'patch',
    },
    {
      type: 'refactor',
      release: 'patch',
    },
    {
      type: 'perf',
      release: 'major',
    },
    {
      type: 'test',
      release: 'patch',
    },
    {
      type: 'build',
      release: 'patch',
    },
    {
      type: 'ci',
      release: 'patch',
    },
    {
      type: 'chore',
      release: 'patch',
    },
  ],
};
