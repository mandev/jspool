#!/bin/sh

if [ -f ./jre/bin/java ]
then
 echo "Launching private jre"
 chmod +x ./jre/bin/java
 ./jre/bin/java -Xmx256m -jar jSpool.jar
else 
 echo "Launching public jre"
 java -Xmx256m -jar jSpool.jar
fi

