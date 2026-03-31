# Android Development Environment Options on School Debian Machine

## 1. Goal of this note
This note summarizes the discussion about possible Android development setups on your school Debian machine, using the machine details and constraints you provided.

The options discussed were:
1. Running Android development tools on the **host** using `/goinfre`
2. Running Android development tools inside a **virtual machine**
3. Running Android development tools in a **Docker container** using `/goinfre`

It also includes the final verdict.

---

## 2. Your host machine constraints and findings

### 2.1 Constraints you mentioned
- You are using a **school Linux Debian machine**
- You use **virtual machine manager 4.0.0 powered by libvirt**
- You do **not have sudo rights** on the host
- You are concerned about **usable disk space**
- You want to explore:
  - Android emulator
  - Real Android phone testing
  - USB connectivity / ADB visibility

### 2.2 Host machine checks you ran

#### CPU virtualization support
```bash
egrep -c '(vmx|svm)' /proc/cpuinfo
```
Output:
- `40`

Meaning:
- CPU virtualization support is present.

#### KVM device exists
```bash
ls -l /dev/kvm
```
Output:
- `/dev/kvm` exists

#### KVM access check
```bash
test -r /dev/kvm && test -w /dev/kvm && echo KVM_OK || echo KVM_BLOCKED
```
Output:
- `KVM_OK`

Meaning:
- Your current user can use KVM.
- Host-side Android Emulator acceleration is not blocked by KVM permissions.

#### User groups
```bash
groups
```
Output:
- `2023_singapore _developer`

#### PATH check
```bash
echo $PATH
```
Output included:
- `/home/sthiagar/bin`
- system paths

Meaning:
- `adb` and `emulator` were not currently installed or not on PATH.

#### ADB check
```bash
adb version
adb devices
```
Output:
- `command not found`

Meaning:
- Android platform-tools were not installed on host at that time.

---

## 3. Disk space findings
You provided:

```bash
df -h
```

Important mount points:
- `/home/sthiagar` → about **1.5G free**
- `/goinfre` → about **32G free**
- `/sgoinfre` → about **973G free**
- `/` → about **135G free**

### Interpretation
- `/home/sthiagar` is too small for a comfortable Android setup.
- `/goinfre` is the practical local place for Android tools.
- `/sgoinfre` has lots of space, but looks like shared/network storage, so it is less ideal for active Android SDK/emulator use.
- Lack of sudo does not stop user-space installation into `/goinfre`.

---

## 4. Host execution policy checks
You wanted to know whether host policy blocks running Android Studio binaries.

### `/goinfre` mount options
```bash
findmnt -no TARGET,OPTIONS /goinfre
```
Output:
- `/goinfre rw,relatime`

Meaning:
- No `noexec` flag.

### `/home/sthiagar` mount options
```bash
findmnt -no TARGET,OPTIONS /home/sthiagar
```
Output:
- no `noexec`

### Test executable from `/goinfre`
You created and ran:
```bash
printf '#!/bin/sh\necho EXEC_OK\n' > x
chmod +x x
./x
```
Output:
- `EXEC_OK`

Meaning:
- Binaries/scripts are executable from `/goinfre`.
- No evidence that host policy blocks user-space execution there.

### Directory permissions
```bash
ls -ld /goinfre /goinfre/sthiagar
getfacl /goinfre/sthiagar
```
Meaning:
- Your directory is usable by you.
- No sign of an execution-policy problem from these checks.

---

## 5. Linux compatibility checks for Android Studio

### Architecture
```bash
uname -m
```
Output:
- `x86_64`

### glibc version
```bash
getconf GNU_LIBC_VERSION
ldd --version | head -n 1
```
Output:
- `glibc 2.35`
- `ldd (Ubuntu GLIBC 2.35-0ubuntu3.13) 2.35`

Meaning:
- This satisfies Android Studio's Linux minimum requirement of glibc 2.31+.

### Multiarch / 32-bit library note
You checked:
```bash
dpkg -l libc6:i386 libncurses5:i386 libstdc++6:i386 lib32z1 libbz2-1.0:i386 2>/dev/null
dpkg --print-foreign-architectures
```
Output:
- no listed foreign architectures
- no installed i386 packages shown

Meaning:
- Those Ubuntu-noted 32-bit compatibility packages were not present.
- This does **not** prove Android Studio will fail.
- It only means that if Android Studio later complains about missing shared libraries, this is one area to investigate.

---

## 6. What these findings mean overall for the host
At this point, the host machine findings supported the following:

- CPU virtualization support is present
- KVM is usable by your account
- `/goinfre` is executable
- Host Linux ABI is suitable (`x86_64`, glibc 2.35)
- Disk space in `/goinfre` is sufficient for a practical Android setup
- `adb` and Android Studio were not yet installed, but that is a tooling gap, not evidence of policy blocking

### Conclusion from the checks
There was **no evidence that the school host blocks Android development binaries from running in `/goinfre`**.

---

## 7. Option 1 — Run on host using `/goinfre`

### Selling point
Best **overall** choice.

### Why it is attractive
- No sudo is required if tools are unpacked into your own writable directory.
- `/goinfre` has enough space.
- You already confirmed execution from `/goinfre` works.
- You already confirmed KVM works, so host emulator remains possible if you want it later.
- Host is the simplest place for:
  - `adb`
  - USB phone debugging
  - device installation via USB
  - possible emulator later

### Recommended storage layout on host
Suggested environment variables:
```bash
export ANDROID_HOME=/goinfre/sthiagar/android-sdk
export ANDROID_USER_HOME=/goinfre/sthiagar/android-user
export ANDROID_AVD_HOME=/goinfre/sthiagar/android-avd
export GRADLE_USER_HOME=/goinfre/sthiagar/gradle-home
export PATH="$ANDROID_HOME/platform-tools:$PATH"
```

### Best use cases
- Real phone testing over USB
- Installing finished APK to phone
- Host `adb`
- Future emulator use if needed

### Weak point
- Android Studio and SDK still consume real storage on host, even if placed in `/goinfre`
- If some shared library is missing later, you may not be able to fix it without admin help

---

## 8. Option 2 — Run inside a virtual machine

### Selling point
Best **isolation / sandbox / rollback** choice.

### Why it is attractive
- Clean environment separation from the school host
- Easy to keep Android tooling isolated in one place
- Good if you want a disposable lab for experimentation
- Useful if you prefer not to place the full development stack directly on host

### Why it is weaker for your use case
- A guest VM does **not** save disk space; the VM disk still lives on host storage
- Real phone debugging becomes more complicated because you may need:
  - USB passthrough, or
  - network-based debugging to the guest
- If you later want emulator-in-guest, performance and complexity are usually worse than host
- A VM adds another layer between you and the physical device

### KVM not necessary?
You asked to consider VM even when KVM is not necessary.
That makes sense only if your goal is mostly:
- sandboxing
- isolation
- keeping experiments off the host

But if performance matters, host remains stronger.

### Best use cases
- Rollback-friendly experimentation
- Isolated environment
- Avoiding clutter on host at a logical level

### Weak point
- More layers, more friction, more complexity for USB phone work

---

## 9. Option 3 — Run in a Docker container using `/goinfre`

### Selling point
Best **reproducible build environment** choice.

### Why it is attractive
- Good for command-line Android builds
- Good for keeping project, Gradle cache, and SDK files under `/goinfre`
- Good for repeatable builds with pinned tool versions
- Strong option if you do **not care about emulator** and mainly want:
  - build APK
  - test on real phone
  - install final app to phone

### Key limitation
Docker image/layer storage itself is not automatically moved just because your project lives in `/goinfre`. If Docker daemon storage is managed elsewhere by the school host, some disk usage may still occur outside `/goinfre`.

### Best practical design
For your use case, the preferred design discussed was:
- build APK inside Docker
- connect phone by USB to the host
- use **host `adb`** to install APK to the phone

This is cleaner than trying to make the container own the USB phone connection.

### Is USB install to phone possible with Dockerized development?
Yes.
The practical workflow is:
1. Build APK inside container
2. On host, connect phone via USB
3. On host, run `adb devices`
4. Install APK with `adb install`

### Best use cases
- Reproducible builds
- Controlled CLI build environment
- Keeping Android build tooling organized under `/goinfre`
- Real-phone workflow without emulator

### Weak point
- Not the best fit for Android Studio GUI
- Not the best default path for emulator window use
- USB inside container is possible but more awkward than host adb

---

## 10. Real phone testing and final install
A major part of the discussion was whether you can:
- use a real phone for testing
- install the finished product to the phone via USB
- avoid relying on emulator

### Answer
Yes.

### Most practical setup
- Build using host or container
- Use **host `adb`** for the phone
- Install generated APK onto the physical device over USB

### Why this is attractive
- Keeps debugging and deployment simple
- Avoids emulator complexity
- Matches your stated preference to use a real phone instead of emulator

---

## 11. Rational reasons someone might still choose a guest VM even though host is capable
This question came up directly.

### Real rationale for choosing guest VM
Use a guest VM if you value:
- isolation
- snapshots / rollback
- a disposable environment
- keeping experiments and breakage away from the host

### Not a strong rationale
These are **not** strong reasons, based on our discussion:
- saving disk space
- getting better emulator performance
- making USB phone workflow simpler

For your case, VM is rational only if you want a sandbox more than you want convenience.

---

## 12. Side alignment with earlier project checklist
You asked whether the earlier `project_checklist.md` aligned with the verdict in this chat.

### Outcome
Yes, they mostly aligned.

### Combined interpretation
- For general coursework progress and web testing, you are **not blocked**.
- For actual Android-device testing/install later, **host `/goinfre`** remained the best path.
- VM remained mainly an isolation choice, not the best default development path.

---

## 13. Final comparison summary

### 1) Host `/goinfre`
**Selling point:** best overall balance of practicality, performance, and direct device access.

Best for:
- real phone testing
- host adb
- final APK install to phone
- simplest workflow
- possible emulator later

### 2) Virtual machine
**Selling point:** best sandbox and rollback environment.

Best for:
- isolation
- experimentation
- disposable environment

### 3) Docker in `/goinfre`
**Selling point:** best reproducible build environment.

Best for:
- command-line builds
- organized SDK/Gradle/project storage
- real phone workflow when combined with host adb

---

## 14. Final verdict

### Main verdict
For your machine and your stated goals, the best overall choice is:

# **Run Android development on the host using `/goinfre`**

### Why
Because your checks already showed:
- `/goinfre` can execute binaries
- host Linux compatibility is good
- KVM works
- `/goinfre` has enough space
- no evidence of host policy blocking user-space Android tooling

### Secondary verdict
If you want a cleaner, repeatable command-line build workflow and do **not care about emulator**, then:

# **Docker in `/goinfre` is a strong second choice**

especially when paired with:
- host USB connection
- host `adb`
- real phone testing/install

### VM verdict
A guest VM is valid, but mainly if you specifically want:
- sandboxing
- rollback
- isolation

It is **not** the best default choice for your use case.

---

## 15. Short conclusion
You are **not forced** into a guest VM.

Your host machine appears capable enough to support Android development from `/goinfre`, and this remains the best overall option.

If you prefer a more controlled build environment without caring about emulator, Docker in `/goinfre` plus host `adb` is also a strong approach.

The guest VM option remains useful mainly for isolation, not because the host is unsuitable.

## Challenges with `/goinfre` and Remaining Options

### Current challenge with `/goinfre`

Although `/goinfre` was originally the preferred location for active development, it later became a bottleneck because the remaining free space dropped too low for Android-related Docker builds.

This became visible during the Docker image build when Flutter attempted to download and write cache data under the container image filesystem, for example:

- Flutter SDK cache files
- Git pack/index data
- Gradle-related artifacts
- Android build components

At that stage, the build failed with `No space left on device`.

The important point is that placing the project source code in `/goinfre` does **not** guarantee that all Docker build storage stays small. Docker image layers, temporary build data, and toolchain downloads can still consume substantial space during `make build`.

### Why `/sgoinfre` becomes relevant

Given the storage pressure on `/goinfre`, `/sgoinfre` becomes the only remaining realistic larger storage area available to me.

However, `/sgoinfre` is not automatically the best development root for all workflows. Earlier discussion concluded that `/goinfre` is still preferable for active development when space is sufficient, because it is the simpler and more direct setup.

### Options I have ruled out

The following option has been ruled out:

- **Docker inside a VM hosted on `/sgoinfre`**  
  I do not want this extra layering, because it adds complexity, more storage overhead, and more friction for development and device testing.

I also do **not** have another larger writable path besides `/goinfre` and `/sgoinfre`.

### What options remain now

Taking the above into account, the remaining practical options are:

#### 1. Continue using `/goinfre`, but only after freeing substantial space
This keeps the simpler preferred setup, but it is only realistic if enough space can be recovered for Flutter, Android SDK components, Gradle artifacts, and Docker image layers.

#### 2. Place the project and development workflow on `/sgoinfre`
This is now the more realistic fallback if `/goinfre` cannot provide enough space. The tradeoff is that `/sgoinfre` may be less ideal for active development performance, but it may be necessary purely because of storage availability.

#### 3. Use a VM hosted on `/sgoinfre`, with Flutter and Android tools installed directly inside the VM
This is the strongest fallback if `/goinfre` remains too small and Docker on `/goinfre` continues to fail. It avoids the extra complexity of running Docker inside the VM, while still benefiting from the larger storage available through `/sgoinfre`.

### Updated practical conclusion

`/goinfre` remains the **preferred** location when enough free space is available, because it is the cleaner and simpler setup for development.

But once `/goinfre` becomes too full for Android Docker builds, the practical decision shifts from “preferred location” to “workable location.” In that situation, `/sgoinfre` becomes relevant not because it is architecturally better, but because it may be the only storage area large enough to continue the project.

So the updated conclusion is:

- **Preferred when space allows:** `/goinfre`
- **Fallback when `/goinfre` is too full:** `/sgoinfre`
- **Avoided:** Docker inside a VM on `/sgoinfre`