default:
    just --list

[group("ini")]
create-qcow2-image:
    qemu-img create -f qcow2 android_disk.qcow2 32G

vm-silent:
    qemu-system-x86_64 \
        -enable-kvm \
        -m 2048 \
        -smp 2 \
        -cpu host \
        -drive file=android_disk.qcow2,if=virtio \
        -netdev user,id=net0,hostfwd=tcp::5555-:5555,hostfwd=tcp::31415-:31415 \
        -device virtio-net-pci,netdev=net0 \
        -boot d \
        -nographic

vm:
    qemu-system-x86_64 \
        -enable-kvm \
        -m 2048 \
        -smp 2 \
        -cpu host \
        -drive file=android_disk.qcow2,if=virtio \
        -netdev user,id=net0,hostfwd=tcp::5555-:5555,hostfwd=tcp::31415-:31415 \
        -device virtio-net-pci,netdev=net0 \
        -boot d \
        -vga vmware \
        -display sdl,gl=on

[group("adb")]
adb-shell:
    adb shell

[group("adb")]
adb-install apk:
    adb install {{ apk }}
