# /goinfre vs /sgoinfre for Android Development

## Context
The goal is to run Android development on a school Linux machine with restricted permissions and limited writable storage.

The original plan was to use a Dockerized Android/Flutter development environment and keep the project on a host path that could support active development, builds, and repeated downloads. 

My attempts to setup a dockerized container on /home failed due to insufficient disk space.  

My next consideration /goinfre vs /sgoinfre.

## Initial preference: `/goinfre`
`/goinfre` was the preferred project root at first for practical development reasons:

- execution from `/goinfre` was confirmed to work
- it behaved like a direct, usable workspace
- it was the simpler path for bind-mounting a project into Docker
- it was the better candidate for active file reads and writes during normal development

Even with Docker, the host path still matters because the source tree is bind-mounted from the host, and development responsiveness still depends on the host filesystem.

## Why Docker did not remove the host-path problem
Using Docker did not make the choice of host folder irrelevant.

Docker isolated the toolchain, but it did not eliminate the dependency on the host path for:

- source files
- build outputs
- mounted caches
- repeated reads and writes during development

More importantly, Docker image layers and tool downloads still consumed substantial storage during `make build`.

That meant a Dockerized workflow on `/goinfre` was still limited by available disk space.

## What changed in practice: `/goinfre` became too small
Although `/goinfre` was still the better workspace path in principle, it later stopped being practical because free space became too low for Android-related Docker builds.

During the build, Flutter and related tooling attempted to download and write cache data, Git pack data, and build artifacts, and the process failed with `No space left on device`.

`/goinfre` remained architecturally cleaner, but storage availability became the deciding factor.

## Where `/sgoinfre` fits
`/sgoinfre` became relevant only because it represented the remaining larger storage area available to you.

It was not the first-choice development root in the original comparison, but once `/goinfre` became too full, `/sgoinfre` had to be reconsidered as a fallback based on capacity rather than preference.

So the role of `/sgoinfre` is:

- not the cleaner option
- not the simpler option
- but potentially the only workable option when `/goinfre` is too full

## Options that were considered and ruled out
The following option was explicitly ruled out:

### Docker inside a VM hosted on `/sgoinfre`
This was rejected because it adds too much layering and complexity:

- host storage on `/sgoinfre`
- VM disk image
- guest filesystem
- Docker daemon storage inside the guest
- Android/Flutter tooling inside the container

That approach was considered too heavy and too complicated for the intended workflow.

Another important limit is that there is no other larger writable path available besides `/goinfre` and `/sgoinfre`.

## Remaining practical options
After ruling out Docker inside a VM on `/sgoinfre`, the remaining realistic options are:

### 1. Continue with `/goinfre`, but only if space can be freed
This keeps the simpler and originally preferred setup.

It is still the better path for an active development loop, but only if enough storage can be recovered for:

- Flutter downloads
- Android SDK components
- Gradle artifacts
- Docker build layers and temporary data

### 2. Move the project/workflow to `/sgoinfre`
This becomes the fallback if `/goinfre` cannot support the required downloads and build storage.

The reason to choose `/sgoinfre` is not that it is better for day-to-day development, but that it may be the only location with enough space to continue the project.

### 3. Use a VM hosted on `/sgoinfre`, with Flutter and Android tools installed directly inside the VM
This is the strongest fallback after Docker-on-`/goinfre` becomes impractical.

It uses `/sgoinfre` for storage while avoiding the extra complexity of running Docker inside the guest.

## Final conclusion
The final findings lead to this updated conclusion:

- **Preferred when space is sufficient:** `/goinfre`
- **Fallback when `/goinfre` becomes too full:** `/sgoinfre`
- **Ruled out:** Docker inside a VM hosted on `/sgoinfre`

So `/goinfre` is still preferred in principle because it is the cleaner and simpler development root.

But once storage on `/goinfre` becomes too limited for Android/Flutter Docker builds, the practical decision shifts. At that point, `/sgoinfre` is no longer a secondary theoretical option — it becomes the realistic fallback based on available space.
