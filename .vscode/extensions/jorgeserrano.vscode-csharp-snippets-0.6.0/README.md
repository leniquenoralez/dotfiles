# C# Snippets for Visual Studio Code

![alt text](https://github.com/J0rgeSerran0/vscode-csharp-snippets/raw/master/images/vscode-csharp-snippets.png "C# Snippets")

This extension for Visual Studio Code adds snippets for C#.

You can find this extension in the [Visual Studio Code Marketplace](https://marketplace.visualstudio.com/items?itemName=jorgeserrano.vscode-csharp-snippets).

See the [CHANGELOG](https://github.com/J0rgeSerran0/vscode-csharp-snippets/blob/master/CHANGELOG.md) for the latest changes included.

## Usage
Put the cursor on the C# file.

Type part of a snippet, press `tab`, and the snippet unfolds.

If you have problems to see the snippets, press `Ctrl`+`Space` (Windows, Linux) or `Cmd`+`Space` (OSX).

(see the [TUTORIALS](https://github.com/J0rgeSerran0/vscode-csharp-snippets/blob/master/TUTORIALS.md) to know more)


[This is not necessary anymore]
~~**IMPORTANT** :: If you use the *C# for Visual Studio Code (powered by OmniSharp)* extension, but you want to see the **C# Snippets** only, [read this post](https://geeks.ms/jorge/2017/07/16/how-to-disable-the-c-snippets-for-the-c-extension-of-visual-studio-code/).~~


### C# general snippets
```csharp
#helloworld
~
cclear
cgo
classa
classd
const
cr
crk
csproj_1.0
csproj_1.1
csproj_2.0
csproj_2.1
csproj_3.1
csproj_5
cwl
guid
guidn
immutable
linq_distinct
linq_where
mstest
prop
propi
propinit
propr
pum
pvm
record
singleton
singletonl
singletonts
```

### .NET Core C# snippets
```csharp
sln
```

### ASP.NET Core C# snippets
```csharp
ac_#helloworld_Startup
ac_#helloworld_WebApp
ac_#helloworld_WebApi
ac_csproj_2.0
ac_csproj_2.1
ac_csproj_5
ac_conf
ac_conf_file
ac_controller
ac_startupenv
```

### gRPC C# snippets (.NET 5)
```csharp
gRPC_client_csproj
gRPC_client_program
gRPC_proto
gRPC_server_csproj
gRPC_server_program
gRPC_server_service
gRPC_server_settings
gRPC_server_startup
```

### XML Comments snippets
```csharp
xml_<c>
xml_<code>
xml_<example>
xml_<exception>
xml_<include>
xml_<list>
xml_<para>
xml_<param>
xml_<paramref>
xml_<permission>
xml_<remarks>
xml_<returns>
xml_<see>
xml_<seealso>
xml_<summary>
xml_<typeparam>
xml_<typeparamref>
xml_<value>
```


## Installation

1. Install Visual Studio Code 1.5.0 or higher
2. Launch Visual Studio Code
3. From the command palette `Ctrl`-`Shift`-`P` (Windows, Linux) or `Cmd`-`Shift`-`P` (OSX)
4. Select `Install Extension`
5. Search and choose the extension
6. Reload Visual Studio Code
