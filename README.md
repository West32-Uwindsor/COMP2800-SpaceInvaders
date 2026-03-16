Course: COMP.2800: Software Development 
Assignment #2: Web Game Development in JavaScript - Space Invaders 
Student Name: Josh West
Student ID: 110143652

Table of Contents
1. Abstract
2. Understanding of the Project
3. Simple Manual
4. Major Issues and Challenges Faced
5. Summary and Possible Future Extensions
6. Appendixes

1-Abstract
This project details the design, development, and deployment of an interactive, web-based "Space Invaders" style arcade game utilizing modern JavaScript and the HTML5 Canvas API. The application was built from the ground up to demonstrate core software engineering design patterns, specifically class-based inheritance for game entities and a Publish-Subscribe (Pub/Sub) event system to manage decoupled state communication. Furthermore, this project served as a practical application of DevOps methodologies. The development environment was strictly managed within GitHub Codespaces, and the final production build was continuously deployed and hosted on the Microsoft Azure Cloud Environment via Azure Static Web Apps. The resulting application features custom-drawn graphical assets, dynamic collision detection, and comprehensive game lifecycle management.

2-Understanding of the Project
The primary objective of this assignment was to transition from building static web pages to architecting a dynamic, real-time software application. To achieve this, several advanced programming paradigms and logic structures were implemented:
Event-Driven Architecture (The Pub/Sub Pattern): A major structural component of this project is the EventEmitter class. In simple applications, keyboard inputs directly manipulate object coordinates. However, to ensure scalability and loose coupling, I implemented a Publish-Subscribe pattern. When a user presses the spacebar, the window listener does not directly call the hero's fire method; instead, it broadcasts a generic Messages.KEY_EVENT_SPACE event. The game's initialization logic subscribes to this event and dictates the response. This pattern proved vital for complex interactions, such as when a laser intersects an enemy, triggering a COLLISION_ENEMY_LASER event that independently handles object destruction and score incrementation without tangling the physics math with the UI logic.
Object-Oriented Design and The Game Loop: The game utilizes class-based inheritance to manage its entities. A base GameObject class was established to handle fundamental properties like Cartesian coordinates (x, y), bounding box dimensions, and canvas rendering methods (ctx.drawImage). Specialized classes such as Hero, Enemy, and Laser extend this base class. For instance, the Hero class encapsulates its own weapon cooldown logic to prevent laser spamming, while the Enemy class manages its own automated movement via setInterval. The entire game state is tied together by a central "Game Loop" that runs every 100 milliseconds, continuously clearing the canvas, recalculating positions, evaluating collisions, and redrawing the updated frame.
Asynchronous Asset Management: Transitioning from standard HTML elements to the Canvas API required a deep understanding of asynchronous JavaScript. Because the ctx.drawImage() method requires the image file to be fully downloaded before it can be rendered, attempting to draw sprites synchronously would result in a blank canvas. To solve this, I engineered a Promise-based loadTexture() function and wrapped the game's startup sequence in an async window.onload event. This ensured the game loop only began after the custom .png assets were successfully resolved over the network.

3-Simple Manual
Accessing the Game:
Live Game Link (Microsoft Azure): https://calm-sand-0c9ae0010.2.azurestaticapps.net/
Source Code (GitHub Codespaces): https://github.com/West32-Uwindsor/COMP2800-SpaceInvaders
Controls and Gameplay:
Movement: Use the Left, Right, Up, and Down Arrow Keys to navigate your spaceship across the viewport.
Combat: Press the Spacebar to fire lasers at the descending alien formation.
Objective: You must shoot and destroy all alien ships on the screen to achieve a Victory condition.
Defeat: You start with 3 lives (represented by icons in the bottom right). If an alien ship collides with you, you lose a life. Losing all 3 lives results in a Game Over.
Restart: Upon reaching either a Victory or Defeat screen, press the Enter key to instantly reset the board and begin a new session.

4-Major Issues and Challenges Faced
Throughout the development cycle, I navigated several significant technical and logistical hurdles:
DevOps and Environment Configuration: Establishing the required DevOps pipeline was a highly involved process. Connecting the Microsoft Azure Student account with GitHub Codespaces required careful configuration of deployment credentials. One of the largest bottlenecks was securing the GitHub Student Developer Pack. The verification and approval process took longer than expected, which temporarily delayed my ability to fully access the necessary cloud integration tools and initialize the Azure Static Web App deployment pipeline.
Custom Sprite Creation and Integration: To elevate the visual quality of the project beyond basic colored rectangles (greyboxing), I took the extra time to manually draw custom sprites for the spaceship, the aliens, and the lasers using image manipulation software. This was surprisingly difficult, as I had to ensure the exported transparent .png files perfectly matched the hardcoded bounding box mathematics (e.g., exactly 98x75 pixels for the Hero and 98x50 pixels for the Enemies). If the drawn sprite did not fill the bounding box correctly, the visual collision would look completely disconnected from the mathematical collision.
Collision Detection Mathematics: Implementing the intersectRect algorithm was a challenging conceptual hurdle. Rather than calculating if two rectangles positively overlap, the algorithm requires evaluating four negative separation conditions (e.g., checking if the left edge of rectangle A is strictly greater than the right edge of rectangle B). Understanding that a collision is only verified when all separation conditions return false was a counter-intuitive but highly efficient application of 2D physics math that required significant testing to perfect.

5-Summary and Possible Future Extensions
This project successfully synthesized core web technologies (JavaScript, HTML5 Canvas) with professional software engineering practices (DevOps, Azure Cloud Hosting, Object-Oriented Architecture). The resulting application is a fully playable, responsive arcade game.
Should this project be developed further, several extensions could be implemented:
Progressive Level Scaling: Implementing a system where the enemy interval timer decreases (causing them to move down the screen faster) after each wave is defeated, increasing the difficulty.
Audio Integration: Utilizing the HTML5 Audio API to introduce background music and sound effects for laser firing and explosions to increase player immersion.
Persistent High Scores: Integrating the browser's localStorage API to save and display a player's highest score across different, disconnected play sessions.

6-Appendixes
Microsoft Web-Dev-For-Beginners Space Game Tutorial: https://github.com/microsoft/Web-Dev-For-Beginners/tree/main/6-space-game
Project GitHub Repository: https://github.com/West32-Uwindsor/COMP2800-SpaceInvaders
Live Azure Deployment: https://calm-sand-0c9ae0010.2.azurestaticapps.net/
MDN Web Docs (Canvas API): https://developer.mozilla.org/en-US/docs/Web/API/Canvas_API
GNU Image Manipulation Program (GIMP) - Used for creating custom .png sprite assets:
https://www.gimp.org/

