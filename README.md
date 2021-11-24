This action copies your TreeStickies notes and snapshots whose names start with a specified filter-string to your another repository. 

This will help you to copy some of the data in your private repository to your private repository.

## Inputs

## `source-dir`

Source working directory name on the runner. Default is 'private'.

## `destination-dir`

Destination working directory name on the runner. Default is 'public'.

## `filter-string`

Data with names starting with this string will be copied. Default is 'public/'.

## Usage

```
uses: actions/tree-stickies-copy-selected-note@v1.0
```

Use this action in your TreeStickies data repository.

TreeStickies notes and snapshots whose names start with public/ are copied into destination-dir on the runner.

e.g.) 
- public/journal
- public/snapshot01

Please set such a note name from [Rename this note] menu of TreeStickies app.
The name of the snapshot is given at creation time.