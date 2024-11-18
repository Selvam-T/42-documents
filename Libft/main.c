/* ************************************************************************** */
/*                                                                            */
/*                                                        :::      ::::::::   */
/*   main.c                                             :+:      :+:    :+:   */
/*                                                    +:+ +:+         +:+     */
/*   By: sneo <marvin@42.fr>                        +#+  +:+       +#+        */
/*                                                +#+#+#+#+#+   +#+           */
/*   Created: 2023/09/08 12:37:11 by sneo              #+#    #+#             */
/*   Updated: 2023/09/08 12:37:16 by sneo             ###   ########.fr       */
/*                                                                            */
/* ************************************************************************** */

#include "libft.h"
#include <stdio.h>
#include <ctype.h>
#include <string.h>
#include <unistd.h>

int	main(void)
{
	printf("isalpha *********************************\n");
	printf("non-zero: %d\n", isalpha('e'));
	printf("non-zero: %d\n", ft_isalpha('e'));
	printf("zero: %d\n", isalpha('3'));
	printf("zero: %d\n", ft_isalpha('3'));
	printf("isdigit *********************************\n");
	printf("non-zero: %d\n", isdigit('4'));
	printf("non-zero: %d\n", ft_isdigit('4'));
	printf("zero: %d\n", isdigit('w'));
	printf("zero: %d\n", ft_isdigit('w'));
	printf("isalnum *********************************\n");
	printf("non-zero: %d\n", isalnum('e'));
	printf("non-zero: %d\n", ft_isalnum('e'));
	printf("zero: %d\n", isalnum(','));
	printf("zero: %d\n", ft_isalnum(','));
	printf("isascii *********************************\n");
	printf("non-zero: %d\n", isascii('e'));
	printf("non-zero: %d\n", ft_isascii('e'));
	printf("zero: %d\n", isascii(234));
	printf("zero: %d\n", ft_isascii(234));
	printf("isprint *********************************\n");
	printf("non-zero: %d\n", isprint('e'));
	printf("non-zero: %d\n", ft_isprint('e'));
	printf("zero: %d\n", isprint(23));
	printf("zero: %d\n", ft_isprint(23));
	printf("strlen *********************************\n");
	printf("3: %d\n", ft_strlen("hwp"));
	printf("0: %d\n", ft_strlen(""));
	 // Code below cause "terminated by signal SIGSEGV (Address boundary error)"
	 //   even though ft_memset seems correct.
	/*printf("memset *********************************\n");
	char	*s1;
	char	*s2;
	s1 = "abc";
	s2 = "defgh";
	write(1, &s1, 1);
	write(1, "\n", 1);
	write(1, s1, 3);
	write(1, "\n", 1);
	s2 = ft_memset(s1, 65, 2);
	write(1, s2, 2);*/
	printf("memset *********************************\n");
	char	*s1;
	char	*s2;
	s1 = "abc";
	s2 = malloc(4); //Chris used malloc and strcpy to solve the issue.
	s2 = strcpy(s2, s1); //Without malloc and strcpy, s1 and s2 are read-only.
	printf("0: %d\n", memcmp(memset(s2, 65, 2), ft_memset(s2, 65, 2), 2));
	printf("bzero *********************************\n");
	char	*s3;
	s3 = malloc(4);
	s3 = strcpy(s3, s1);
	bzero(s2, 2);
	ft_bzero(s3, 2);
	printf("0: %d\n", memcmp(s2, s3, 3));
	printf("memcpy *********************************\n");
	printf("s3: %s\n", s3);
	printf("s1: %s\n", s1);
	printf("0: %d\n", strcmp(s3, ft_memcpy(s3, s1, 3)));
	printf("memmove *********************************\n");
	printf("s3: %s\n", s3);
	printf("s2: %s\n", s2);
	printf("0: %d\n", strcmp(s3, ft_memmove(s3, s2, 3)));
}
