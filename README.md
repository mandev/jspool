# jSpool

jSpool is a cross plateform file spooler. 

Features:  
* easy to use graphical user interface
* support multiple concurrent channels with one input/output
* input types : file, ftp, mail, script
* stability check based on datetime and checksum
* file filter based on regexp and file size
* support sub-directory, batch and ordering processing, 
* output types : move, ftp, mail, unzip, exec, scripts, etc. 
* javascript with full java integration
* numerous java libraries included 
* log window for each channel
* tested on Linux, Windows and MacOS
* various scripts provided as examples

## Build 
 
JSpool uses the [jasmin](https://github.com/mandev/jasmin) library. You must download and build this library before building jSpool. 

Java 11+ is required to build jSpool. 

```
mvn clean install
```

## Launch 

```
java -jar jspool.jar
```

Note. the name of resulting jar depends on the current application version.

## Contribute

Contributions are welcome.

1. Fork the project on Github (git clone ...)
2. Create a local feature branch (git checkout -b newFeature)
3. Commit modifications on the local feature branch (git commit -am "new modification")
4. Push the local branch (git push origin newFeature)
5. Create a pull request

## License

jSpool is provided under GPL v3 licence.

