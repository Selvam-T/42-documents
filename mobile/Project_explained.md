
1) To be able to delete files from host (sthiagar) created inside container by container user (developer), I must chmod all files in container to have +rwx permissions.
	> make chmod
	
2) Write code for ex00 using dart



Mobile - 0 - Basic-of-the-mobile-application
--------------------------------------------

ex00:  
 
A) 
- Create a new ex00 project using the tools provided by the framework of your choice.
	- framework of my choice is Flutter
	- flutter create ex00 

B)  		
- Understand the structure of a Flutter project

	- lib/main.dart → where your app starts.
	- pubspec.yaml → dependencies + assets.
	- android/, ios/, web/ → platform wrappers.
	- lib/ → where your widgets live.
	
- what widgets are and their different states.

	- StatelessWidget → no internal change, redraw only when parent rebuilds.
	- StatefulWidget → keeps internal state, can change over time (with setState).

	- Use StatelessWidget because the text does not change in widget, in other words we don't change the state of the widget.

C)  
- Project must contain a single page with some widgets:
	- text widget (centered horizontally and vertically).
	- button (centered horizontally and vertically).
	
	- Button click - display “Button pressed” in the debug console.
	- Application must be responsive.
	
	- Dart code tasks, not Flutter CLI task.
		- Dart is an open-source general-purpose programming language developed by Google, 
		  used for the development of apps using the Flutter framework.

D)
- Additionally, learn to use Debug mode vs Release mode
- Assert (Debug mode)


ex01:
- build on ex00
- It should display “Hello World!” instead of the initial text.
- Each time you click the button, the text should toggle between the initial text 
  and “Hello World!”.

- Use Steteful widget, because we toggle text message, by calling setState.


