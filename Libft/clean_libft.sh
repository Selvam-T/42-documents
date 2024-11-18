#!/bin/bash

directory="/home/sthiagar/libft/libft/"

#exclude_files=("ft_*.c" "libft.*" "Makefile")

find "$directory" -type f \( -name "ft_*.c" \
                          -o -name "libft.*" \
                          -o -name "Makefile" \) -prune -o -exec rm {} \;
echo "Files excluding ft_*.c, libft.* and Makefile deleted in $directory"
