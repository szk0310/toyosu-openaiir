firebase.initializeApp({
		//niyatest TESTtoyosuOpenAir
			apiKey: "AIzaSyCnnpdVubcLLthKdisrw9pfNWUxh52CUDA",
			projectId: "testtoyosuopenair",
		
		//本番 toyosuOpenAir
			//apiKey: "AIzaSyCx6-2f7hPy8pgXEe0m2qpGHyx6oYZPiQ8",
			//projectId: "toyosuopenair",
        });
firebase.auth().signInAnonymously().catch(error => console.log(error));