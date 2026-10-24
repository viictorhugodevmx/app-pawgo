import * as ImagePicker from 'expo-image-picker';
import {
  Directory,
  File,
  Paths,
} from 'expo-file-system';

const WALK_MEMORIES_DIRECTORY =
  new Directory(
    Paths.document,
    'walk-memories',
  );

function getFileExtension(
  fileName: string | null | undefined,
  uri: string,
): string {
  const source =
    fileName ?? uri;

  const match =
    source.match(
      /\.([a-zA-Z0-9]+)(?:\?|$)/,
    );

  return match?.[1]?.toLowerCase() ??
    'jpg';
}

function persistWalkPhoto(
  sourceUri: string,
  fileName?: string | null,
): string {
  WALK_MEMORIES_DIRECTORY.create({
    idempotent: true,
    intermediates: true,
  });

  const extension =
    getFileExtension(
      fileName,
      sourceUri,
    );

  const destination =
    new File(
      WALK_MEMORIES_DIRECTORY,
      `walk-memory-${Date.now()}.${extension}`,
    );

  const source =
    new File(sourceUri);

  source.copy(destination);

  return destination.uri;
}

export async function pickWalkPhoto(): Promise<
  string | null
> {
  const permission =
    await ImagePicker.requestMediaLibraryPermissionsAsync();

  if (!permission.granted) {
    throw new Error(
      'Photo library permission was denied.',
    );
  }

  const result =
    await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ['images'],
      allowsEditing: true,
      aspect: [4, 3],
      quality: 0.8,
    });

  if (
    result.canceled ||
    !result.assets[0]
  ) {
    return null;
  }

  const asset =
    result.assets[0];

  return persistWalkPhoto(
    asset.uri,
    asset.fileName,
  );
}
