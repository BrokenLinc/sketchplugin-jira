var projectsPath = NSHomeDirectory() + "/.atlassianProjects"

function getProjects() {
	var fileExists = NSFileManager.defaultManager().fileExistsAtPath(projectsPath);
	if (fileExists) {
		var raw = NSString.stringWithContentsOfFile_encoding_error(projectsPath, NSUTF8StringEncoding, nil)
		var projects = raw.split('\n');
		for(var i = 0; i < projects.length; i++) {
			var props = projects[i].split('\t');
			projects[i] = {
				rootURL:props[0],
				authToken:props[1]
			};
		}
		return projects;
	} else {
		return [];
	}
}

function saveProjects(projects) {
	for(var i = 0; i < projects.length; i++) {
		projects[i] = [
			projects[i].rootURL, 
			projects[i].authToken
		].join('\t');
	}
	var raw = projects.join('\n');

	var fileManager = NSFileManager.defaultManager()
	fileManager.createFileAtPath_contents_attributes(projectsPath, raw, nil)
}

function selectProject() {
	var projects = getProjects()
	var projectNames = [];
	for(var i = 0; i < projects.length; i++) {
		projectNames.push(projects[i].rootURL);
	}

	var projectIndex = createSelect('Choose a project...', projectNames, nil);
	return projects[projectIndex];
}

function requestAndSaveProject() {
	var url = [doc askForUserInput:"What is the base URL?" initialValue:"makemydeal.atlassian.net"]
	var username = [doc askForUserInput:"What is your username?" initialValue:"landerson"]
	var password = [doc askForUserInput:"What is your password?" initialValue:"FvpxZEpG363V"]

	var projects = getProjects();
	projects.push({
		rootURL: url,
		authToken: Base64.encode(username+":"+password)
	});
	saveProjects(projects);
}

function exportArtboardsAndSend(project, issue) {
	var loop = [selection objectEnumerator]
	while (item = [loop nextObject]) {
		if (item.className() == "MSArtboardGroup") {
			var path = NSTemporaryDirectory() + item.name() + ".png"
			[doc saveArtboardOrSlice:item toFile: path];
			postFile(path, project, issue)
		}	
	}
}

function postFile(path, project, issue)) {
	var task = NSTask.alloc().init()
	task.setLaunchPath("/usr/bin/curl");
	var args = NSArray.arrayWithObjects(
		"-D-", 
		"-X", "POST",
		"-H", "Authorization: Basic "+project.authToken,
		"-H", "X-Atlassian-Token: nocheck", 
		"-F", "file=@" + path,
		"https://"+project.rootURL+"/rest/api/latest/issue/"+issue+"/attachments", nil);
	task.setArguments(args);
    task.launch();
}
