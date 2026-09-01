const UPPERCASE = 'ABCDEFGHJKLMNPQRSTUVWXYZ'
const LOWERCASE = 'abcdefghijkmnopqrstuvwxyz'
const NUMBERS = '23456789'
const SYMBOLS = '!@#$%&*'
const ALL_CHARACTERS = `${UPPERCASE}${LOWERCASE}${NUMBERS}${SYMBOLS}`

function randomIndex(length: number): number {
  const maximum = Math.floor(256 / length) * length
  const bytes = new Uint8Array(1)

  do {
    crypto.getRandomValues(bytes)
  } while (bytes[0] >= maximum)

  return bytes[0] % length
}

function randomCharacter(characters: string): string {
  return characters[randomIndex(characters.length)]
}

export function generatePassword(length = 16): string {
  const characters = [
    randomCharacter(UPPERCASE),
    randomCharacter(LOWERCASE),
    randomCharacter(NUMBERS),
    randomCharacter(SYMBOLS),
  ]

  while (characters.length < Math.max(length, 8)) {
    characters.push(randomCharacter(ALL_CHARACTERS))
  }

  for (let index = characters.length - 1; index > 0; index -= 1) {
    const swapIndex = randomIndex(index + 1)
    ;[characters[index], characters[swapIndex]] = [
      characters[swapIndex],
      characters[index],
    ]
  }

  return characters.join('')
}
