using System.Collections;
using System.Collections.Generic;
using System.IO;
using System.Linq;
using TMPro;
using UnityEngine;

public class keyboardTaleManager : MonoBehaviour
{
    static keyboardTaleData ktd;
    int iBlock;
    int iWord;
    int iChar;

    public TextMeshProUGUI text;
    public TextMeshProUGUI commText;

    public Color marked;
    public Color unmarked;

    private void OnEnable()
    {
        LoadInput(Path.Combine(Application.streamingAssetsPath, "tales", "taleDemo.txt"));
    }

    void LoadInput(string filePath)
    {
        ktd = new keyboardTaleData(filePath);
        Restart();
    }

    public void Restart()
    {
        iBlock = 0;
        iWord = 0;
        iChar = 0;
        SetText(GetCurrentText());
        commText.text = "";

    }

    bool pressing = false;
    void OnGUI()
    {
        Event e = Event.current;
        if (!pressing && e.isKey && e.type == EventType.KeyDown)
        {
            pressing = true;
            if (e.keyCode.ToString().ToLower().CompareTo(GetNextChar().ToString().ToLower()) == 0)// ||
            //    //iChar == ktd.blocks.ElementAt(iBlock).words.ElementAt(iWord).characters.Count ||
            //    //iWord == ktd.blocks.ElementAt(iBlock).words.Count
            //    )
            {
                SetCOMM();
                ProcessEntry();
                SetText(GetCurrentText());
            }
            //Debug.Log("iB = " + iBlock + "\niW = " + iWord + "\niC = " + iChar + "\n" + e.keyCode.ToString());
        }
        if (e.isKey && e.type == EventType.KeyUp)
            pressing = false;

        //if (e.type == EventType.MouseDown)
        //    Debug.Log(GetNextChar().ToString().ToLower());

    }

    void SetCOMM()
    {
        if (iBlock == ktd.blocks.Count - 1)
            return;
        string message = "";
        message += iBlock + " " + iWord + " " + iChar + " ";
        message += ktd.blocks.ElementAt(iBlock).words.ElementAt(iWord) + " " + ktd.blocks.ElementAt(iBlock).words.ElementAt(iWord).characters.ElementAt(iChar);
        commText.text += message + "\n";
        UDPService.sendString(message);
    }

    char? GetNextChar()
    {
        if (iChar < ktd.blocks.ElementAt(iBlock).words.ElementAt(iWord).characters.Count)
            return ktd.blocks.ElementAt(iBlock).words.ElementAt(iWord).characters.ElementAt(iChar);

        if (iWord < ktd.blocks.ElementAt(iBlock).words.Count)
            return ' ';

        if (iBlock < ktd.blocks.Count)
            return ' ';

        return null;
    }

    void ProcessEntry()
    {
        if (iChar < ktd.blocks.ElementAt(iBlock).words.ElementAt(iWord).characters.Count - 1)
        {
            iChar++;
            return;
        }

        if (iWord < ktd.blocks.ElementAt(iBlock).words.Count - 1)
        {
            iWord++;
            iChar = 0;
            return;
        }

        if (iBlock < ktd.blocks.Count - 1)
        {
            iBlock++;
            iWord = 0;
            iChar = 0;
            return;
        }

    }

    void SetText(string[] texts)
    {
        text.text = string.Format("<color=#{0}>{1}<color=#{2}>{3}", ColorUtility.ToHtmlStringRGBA(marked), texts[0], ColorUtility.ToHtmlStringRGBA(unmarked), texts[1]);
    }

    string[] GetCurrentText()
    {
        string[] text =  new string[2];

        bool marked = false;
        for (int iB = 0; iB <= iBlock; iB++)
        {
            for (int iW = 0; iW < ktd.blocks.ElementAt(iB).words.Count; iW++)
            {
                for (int iC = 0; iC < ktd.blocks.ElementAt(iB).words.ElementAt(iW).characters.Count; iC++)
                {
                    marked = iB < iBlock || (iB == iBlock && iW < iWord) || (iB == iBlock && iW == iWord && iC < iChar);
                    text[marked ? 0 : 1] += ktd.blocks.ElementAt(iB).words.ElementAt(iW).characters.ElementAt(iC);
                }
                text[marked ? 0 : 1] += keyboardTaleData.separator;
            }
            text[marked ? 0 : 1] += ktd.blocks.ElementAt(iB).tailText + "\n";
        }

        return text;

    }

    public void Quit()
    {
        Application.Quit();
    }

}
