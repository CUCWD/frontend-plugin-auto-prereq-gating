frontend-plugin-auto-prereq-gating
###################################

This standalone React package contributes an ``AutoGatingButton`` to the
Open edX Studio course outline. The authoring MFE registers the component in
its course outline header plugin slot; the CMS backend applies the gating
rules through Open edX's gating API.

The button requires subsection gating to be enabled in the course's Advanced
Settings. After confirmation, it configures each subsection to require 100%
completion of the preceding subsection. Applying it replaces existing
prerequisite requirements in that sequence.

Package setup
*************

React, React DOM, Paragon, and the Open edX frontend platform are peer
dependencies supplied by the host MFE. They are also development dependencies
here so this package can compile and lint in isolation. The package build
compiles the source to ``dist/`` and exports ``AutoGatingButton`` from the
package root.

To build the package:

.. code-block:: sh

   npm install
   npm run build

To lint and run the configured test command:

.. code-block:: sh

   npm run lint
   npm test

Local development with frontend-app-authoring
**********************************************

For local development, the authoring app's ignored ``module.config.js`` can
resolve this package from the checkout's ``src`` directory. Its ignored
``env.config.jsx`` registers the exported component in the
``org.openedx.frontend.authoring.course_outline_header_actions.v1`` slot.
The authoring Webpack process must be able to access this repository at the
path configured in ``module.config.js``.

Backend API
***********

The button sends an authenticated POST request to the CMS endpoint
``/auto_prereq_gating/configure/`` with the current course key. The Django
package must be installed and discovered by CMS for the action to succeed.

Publishing to npmjs
*******************

Initial manual publication
==========================

Publish the first version interactively before configuring GitHub Actions
Trusted Publishing. Your npm account must have permission to create packages
in the ``cucwd`` npm organization, which is separate from the GitHub organization.
Confirm that ``package.json`` names the package
``@cucwd/frontend-plugin-auto-prereq-gating`` and contains the intended
unpublished version (``1.0.0`` for the initial release).

Enable two-factor authentication in your npm account settings before the first
publish. Run the following commands from this repository's root, proceeding
only when each command succeeds. Confirm that ``npm whoami`` reports the account
with publishing access to ``cucwd``. Complete the browser login and the additional
publishing authentication prompts when requested:

.. code-block:: bash

   npm login --auth-type=web --registry=https://registry.npmjs.org/
   npm whoami --registry=https://registry.npmjs.org/
   npm ci
   npm run lint
   npm test -- --runInBand
   npm pack --dry-run
   npm publish --access public --registry=https://registry.npmjs.org/

The packaging dry run invokes ``prepack`` to clean and build ``dist/``. Review
its file listing for ``dist/index.js``, widget implementations, and required
styles before publishing. The final command creates the public organization
package on npmjs. This manual step does not require an npm automation token
stored in GitHub Actions.

Verify the initial release:

.. code-block:: bash

   npm view @cucwd/frontend-plugin-auto-prereq-gating@1.0.0 version --registry=https://registry.npmjs.org/

Before the next automated release, ensure the Git tag ``v1.0.0`` points to the
exact committed source that was manually published and is available on the
remote repository. Check existing tags before creating one; do not move an
existing release tag. This lets semantic-release recognize the published
version instead of attempting to publish it again. Published npm versions
cannot be overwritten.

Configure Trusted Publishing
============================

After the package exists, open its settings on npmjs.com and add a
``GitHub Actions`` trusted publisher with these values:

- Organization or user: ``CUCWD``.
- Repository: ``frontend-plugin-auto-prereq-gating``.
- Workflow filename: ``release.yml`` (not the full path).
- Environment name: leave blank; the release job does not declare an environment.
- Allow direct ``npm publish`` for the semantic-release workflow.

See the `npm Trusted Publishing documentation
<https://docs.npmjs.com/trusted-publishers/>`_ for the package-side configuration.

Once trust is configured and the initial release tag is available remotely,
subsequent pushes to ``develop/ulmo.master`` run the release workflow. It installs
npm 11.12.1, installs dependencies, runs lint and tests, and validates packaging
before semantic-release determines whether a new version is needed.

The workflow uses ``id-token: write`` for npm OIDC authentication and the
automatic ``GITHUB_TOKEN`` for GitHub releases and comments. It does not require
``SEMANTIC_RELEASE_NPM_TOKEN`` or a custom GitHub personal access token.
Trusted Publishing must be configured on npmjs; the workflow file alone does
not establish that trust.

License
*******

This project is licensed under the GNU Affero General Public License v3.0.
