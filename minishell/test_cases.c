Test cases built-in-functions
-----------------------------
Wildcard

1. ✅	echo *  --> dir = cwd, wildcard match on * (directories and regular files)

2. 🚫	echo \* --> PDF requires we only handle cwd. So going to root directory is not required.
		    dir = root, wildcard match on * (directories and regular files)

3. ✅	echo *\	--> dir = cwd, wildcard match on * (directories only)

4. 	echo /  --> notice this has no *, therefore not a wildcard

5. 🚫	echo /h*/sth* --> PDF requires we only handle cwd. 
			
6. 🚫	echo /h*/sth*/ --> as above

cd
	//it goes to home directory ✅
	%>cd
	
	//it goes to 1 level up ✅
	%>cd ..
	
	//it goes to ROOT directory ✅
	%>cd /
	
	//do not change PWD, OLDPWD update ✅
	%>cd .
	
	//do not change PWD, OLDPWD udpate ✅
	%>cd ./
	
	//if the Absolute path exists, change dir, if not throw ERROR ✅
	%>cd /home/sthiagar/Practice
	
	//if the relative path exists, change dir, if not throw ERROR ✅
	%>cd ../ft_printf
	
	//call from parent directory of libft ✅
	%>cd libft
	
	//ERROR because there is no absolute path to libft ✅
	%>cd /libft
	
	//ERROR because there is no such file ✅
	%>cd invalidfile
	
	//change to user's home directory ✅
	%>cd ~
	
	//change to previous directory ✅
	%>cd -
	
	//change to home directory of name provided ✅
	%>cd ~sthiagar

	//cd regularfile should throw error, not a directory ✅
	%> cd cd.c	
	
exit--> emma will handle it

unset

1.	%>unset MY_VARIABLE

2.	%>unset VAR1 VAR2 VAR3

	In bash, it returns exit status 0, for all cases whether the variable exists
	or not exist, or whether unset is not followed by env variable names.
env
	%>pwd
	%>/home/sthiagar/Projects/minishell

echo

1.	%>echo *
	//echo * | wc -w >>> compare with minishell echo * 
	//if minishell was reading . and .. directory the count will be 2 more
	
2.	%>echo $DUMMY*
	//if DUMMY is invalid identifier, it does wildcard matching
	
2.	%>echo */
	//diaplays the folders in the current directory
	//folder names terminated with /

3.	%>echo
   	see empty line, the prompt in next line
   	%>

4. 	%>echo -n
	%>

5. 	%>echo abc
	abc
	%>

6. 	%>echo -n abc
	abc%>
	
7.	%>echo -n a b c
	a b c%>
	(Note: the last string has no trailing space

8.	%>echo a b c
	a b c
	%>
	
9.	%>echo $HOME*
	If your HOME is home directory, 
	then it will display directory without * concatenation
	
	If you HOME=dummy, value changed, then it will concatenate * to string
	This behaviour is different from Bash, because our Project requires that we
	do wildcard matching only in the current working directory.
	For more explanations read notes in builtin_cmds_logic.
pwd

1,	%>pwd
	%>/home/sthiagar/Projects/minishell
	
	exit_status is 1, there is no demonstrable case for exit_status of 0
	
env

1,	%>env
	%> .....lists all envs
	
2,	Error message if variable has no assignment or =	
	%>env HOME
	%>env: ‘HOME’: No such file or directory

3,	Display, but not add new var=value pair, at the end of display of all env list
	%>env HOME
	%>.....lists all envs + the new var=value

export

1,	%>export 123variable="value"
	// error invalid name --> throws error message
	%>bash: export: `123variable=value': not a valid identifier
	
2,	%>export MY_VAR=This is a test"
	//the double quote is incorrect, it will prompt user to complete it, 
	//case 1: if you input ", error message is thrown. 
	>"
	%>bash: export: `test
	//exit status = 1
	//case 2: if you press CTRL+C, it will terminate
	%>
	//exit status = 130
3,	%>export =
	error with identifier

4,	%>export MY_VAR=This is a test
	echo $MY_VAR returns 'This'

5,	%>export MY_VAR=This 123
	error with identifier '123'

-----------------------------------------------------------------------------------

Test cases general conditions
-----------------------------

1, Project only requires to handle $ENV_VARIABLES.
	No need to handle $user_created_variables ---> yes agreed
	NO need to handle command substitution. $(pwd)

2, Variable name (letter, digit, _)
	$hello_1 --> valid
	$hello*  --> invalid
	
	Although _="hello" is valid, when you [ echo $_  ] it does not return hello.
	
	Running echo $_ returns an empty space because _ in Bash is a special variable 
	that holds the last argument to the previous command. Since there was no 
	previous command with arguments in your case, $_ is empty.
	
3, Do you handle, incomplete closing parenthesis?
	$ echo "$(pwd" --> throw SYNTAX error at the lexer stage. Project doesn't require it.
	

4, parameter name on command line accepts only num, letters, and underscore_ 
	however parameter cannot begin with 0-9
	Bash allows concatenation. Example name="first", name+="last"
	will concatenate name = firstlast.

5, If you copy the ENV variable list, why do you?
	because the project does not allow set_env() function, that sets values
	to the environment variable.
	
	but why do you need to set value to ENV variables?
	values to variables like HOME, PWD, OLDPWD could be changed by the user
	but set_env() function is not available to update this.
	
	so we copy over the ENV variable list and update our list.
	
6, Test signal
	%>ping google.com
	CTRL-C should interrupt
