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

License
*******

This project is licensed under the GNU Affero General Public License v3.0.
